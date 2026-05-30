const { getAccessToken, addCORSHeaders } = require('./utils');

module.exports = async (req, res) => {
  addCORSHeaders(res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { appid, appsecret } = req.body;
  if (!appid || !appsecret) {
    return res.status(400).json({ error: '缺少 appid 或 appsecret' });
  }

  try {
    await getAccessToken(appid, appsecret);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};
