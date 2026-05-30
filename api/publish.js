const axios = require('axios');
const { getAccessToken, addCORSHeaders } = require('./utils');

module.exports = async (req, res) => {
  addCORSHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { appid, appsecret, media_id } = req.body;
  if (!media_id) {
    return res.status(400).json({ error: '缺少 media_id，请先保存草稿' });
  }

  try {
    const token = await getAccessToken(appid, appsecret);
    const pubRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/freepublish/submit?access_token=${token}`,
      { media_id }
    );

    if (pubRes.data.errcode && pubRes.data.errcode !== 0) {
      throw new Error(`发布失败: ${pubRes.data.errmsg} (${pubRes.data.errcode})`);
    }

    res.json({ ok: true, publish_id: pubRes.data.publish_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
