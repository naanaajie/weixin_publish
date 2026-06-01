/**
 * 微信公众号发布代理服务
 * 运行: node server.js
 * 依赖: npm install express cors axios form-data multer
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const multer = require('multer');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// 服务器公网 IP（用于显示给前端，提醒用户加入微信白名单）
// 这是腾讯云轻量服务器的固定 IP，换服务器时改这里。
const SERVER_PUBLIC_IP = '82.156.226.105';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`\n[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

// 静态文件 - 直接访问 http://localhost:3000 打开前端
app.use(express.static(path.join(__dirname)));

// ─── access_token 缓存（内存，多公众号） ──────────────────────────
const tokenCache = {};

async function getAccessToken(appid, appsecret) {
  const cached = tokenCache[appid];
  if (cached && cached.expiresAt > Date.now() + 60000) {
    return cached.token;
  }
  const res = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
    params: { grant_type: 'client_credential', appid, secret: appsecret }
  });
  if (res.data.errcode) {
    throw new Error(`获取 token 失败: ${res.data.errmsg} (${res.data.errcode})`);
  }
  tokenCache[appid] = {
    token: res.data.access_token,
    expiresAt: Date.now() + res.data.expires_in * 1000
  };
  return res.data.access_token;
}

// ─── 0. 返回服务器公网 IP（前端用，提醒用户加白名单） ────────────
app.get('/api/server-ip', (req, res) => {
  res.json({ ip: SERVER_PUBLIC_IP });
});

// ─── 1. 验证公众号凭据 ─────────────────────────────────────────────
app.post('/api/verify', async (req, res) => {
  const { appid, appsecret } = req.body;
  if (!appid || !appsecret) return res.status(400).json({ error: '缺少 appid 或 appsecret' });
  try {
    await getAccessToken(appid, appsecret);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ─── 2. 上传封面图到微信素材库 ─────────────────────────────────────
app.post('/api/upload-image', upload.single('image'), async (req, res) => {
  const { appid, appsecret } = req.body;
  if (!req.file) return res.status(400).json({ error: '未收到图片文件' });
  try {
    const token = await getAccessToken(appid, appsecret);

    // 上传永久素材（草稿封面必须用永久素材的 media_id，临时素材不可用）
    const form1 = new FormData();
    form1.append('media', req.file.buffer, {
      filename: req.file.originalname || 'cover.jpg',
      contentType: req.file.mimetype
    });
    const permRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/material/add_material?access_token=${token}&type=image`,
      form1, { headers: form1.getHeaders() }
    );
    if (permRes.data.errcode) throw new Error(`上传永久素材失败: ${permRes.data.errmsg} (${permRes.data.errcode})`);
    const media_id = permRes.data.media_id;

    // 同时上传内嵌图片获取 url（用于正文内图片引用）
    const form2 = new FormData();
    form2.append('media', req.file.buffer, {
      filename: req.file.originalname || 'cover.jpg',
      contentType: req.file.mimetype
    });
    const urlRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token=${token}`,
      form2, { headers: form2.getHeaders() }
    );
    const url = urlRes.data.url || '';

    res.json({ ok: true, media_id, url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 3. 保存草稿 ───────────────────────────────────────────────────
app.post('/api/draft', async (req, res) => {
  const { appid, appsecret, title, content, thumb_media_id, author, digest } = req.body;
  if (!title || !content) return res.status(400).json({ error: '标题和内容不能为空' });
  try {
    const token = await getAccessToken(appid, appsecret);
    const article = {
      title,
      author: author || '',
      digest: digest || '',
      content,
      need_open_comment: 0,
      only_fans_can_comment: 0
    };
    // 微信不接受空 thumb_media_id，只在有值时才传
    if (thumb_media_id) article.thumb_media_id = thumb_media_id;
    const body = { articles: [article] };
    console.log('草稿请求体:', JSON.stringify({ title: article.title, has_thumb: !!article.thumb_media_id, content_len: content.length }));
    const draftRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
      body,
      { headers: { 'Content-Type': 'application/json' } }
    );
    console.log('微信草稿响应:', JSON.stringify(draftRes.data));
    if (draftRes.data.errcode && draftRes.data.errcode !== 0) {
      throw new Error(`创建草稿失败: ${draftRes.data.errmsg} (${draftRes.data.errcode})`);
    }
    console.log('✅ 草稿创建成功, media_id:', draftRes.data.media_id);
    res.json({ ok: true, media_id: draftRes.data.media_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 4. 发布草稿（审核后推送） ────────────────────────────────────
app.post('/api/publish', async (req, res) => {
  const { appid, appsecret, media_id } = req.body;
  console.log('⚠️  收到 /api/publish 请求, media_id:', media_id);
  if (!media_id) return res.status(400).json({ error: '缺少 media_id，请先保存草稿' });
  try {
    const token = await getAccessToken(appid, appsecret);
    const pubRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${token}`,
      { media_id },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (pubRes.data.errcode && pubRes.data.errcode !== 0) {
      throw new Error(`发布失败: ${pubRes.data.errmsg} (${pubRes.data.errcode})`);
    }
    res.json({ ok: true, publish_id: pubRes.data.publish_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── 5. 群发（立即推送给所有关注者） ──────────────────────────────
app.post('/api/masssend', async (req, res) => {
  const { appid, appsecret, media_id } = req.body;
  if (!media_id) return res.status(400).json({ error: '缺少 media_id' });
  try {
    const token = await getAccessToken(appid, appsecret);
    const sendRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=${token}`,
      {
        filter: { is_to_all: true },
        mpnews: { media_id },
        msgtype: 'mpnews',
        send_ignore_reprint: 1
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (sendRes.data.errcode && sendRes.data.errcode !== 0) {
      throw new Error(`群发失败: ${sendRes.data.errmsg} (${sendRes.data.errcode})`);
    }
    res.json({ ok: true, msg_id: sendRes.data.msg_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`\n✅ 服务启动成功`);
  console.log(`📱 前端地址: http://localhost:${PORT}`);
  console.log(`🔌 API 地址: http://localhost:${PORT}/api\n`);
});
