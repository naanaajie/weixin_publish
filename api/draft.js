const axios = require('axios');
const { getAccessToken, addCORSHeaders } = require('./utils');

module.exports = async (req, res) => {
  addCORSHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { appid, appsecret, title, content, thumb_media_id, author, digest } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: '标题和内容不能为空' });
  }

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
    if (thumb_media_id) article.thumb_media_id = thumb_media_id;

    const body = { articles: [article] };
    const draftRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/draft/add?access_token=${token}`,
      body
    );

    if (draftRes.data.errcode && draftRes.data.errcode !== 0) {
      throw new Error(`创建草稿失败: ${draftRes.data.errmsg} (${draftRes.data.errcode})`);
    }

    res.json({ ok: true, media_id: draftRes.data.media_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
