const axios = require('axios');

// access_token 缓存（内存，多公众号）
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

// CORS 响应头
function addCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = { getAccessToken, addCORSHeaders };
