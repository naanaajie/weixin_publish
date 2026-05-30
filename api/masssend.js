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
    return res.status(400).json({ error: '缺少 media_id' });
  }

  try {
    const token = await getAccessToken(appid, appsecret);
    const sendRes = await axios.post(
      `https://api.weixin.qq.com/cgi-bin/message/mass/sendall?access_token=${token}`,
      {
        filter: { is_to_all: true },
        mpnews: { media_id },
        msgtype: 'mpnews',
        send_ignore_reprint: 1
      }
    );

    if (sendRes.data.errcode && sendRes.data.errcode !== 0) {
      throw new Error(`群发失败: ${sendRes.data.errmsg} (${sendRes.data.errcode})`);
    }

    res.json({ ok: true, msg_id: sendRes.data.msg_id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
