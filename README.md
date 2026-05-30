# 微信公众号发布助手

手机端网页 + Node.js 代理，一键发布文章到微信公众号。

## 🚀 在线访问

**立即体验**：https://weixinpublish-production.up.railway.app/

> 首次使用需在「公众号配置」中填写后端地址为：`https://weixinpublish-production.up.railway.app`

## 文件结构

```
wechat-publisher/
├── index.html   # 前端（手机端网页，直接浏览器打开）
├── server.js    # 后端代理（Node.js + Express）
├── package.json
└── README.md
```

## 快速启动

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端

```bash
node server.js
```

启动后访问 http://localhost:3000 即可打开前端页面。

### 3. 配置公众号

在「公众号配置」Tab 中点击「新增」，填写：
- **公众号名称**：便于识别
- **AppID**：微信公众平台 → 设置 → 公众号设置 → 基本信息
- **AppSecret**：同上页面，点击查看
- **后端地址**：默认 `http://localhost:3000`

点击「保存」时会自动验证凭据是否有效。

### 4. 发布文章

1. 切换到「发布文章」Tab
2. 选择目标公众号
3. 上传封面图（JPG/PNG，≤10MB）
4. 填写标题、作者、摘要
5. 粘贴正文（支持 HTML 格式）
6. 选择发布方式：
   - **保存草稿**：进入草稿箱，人工审核后再发
   - **立即群发**：直接推送给所有关注者（⚠️ 每天限 1 次）
7. 点击「发布文章」，实时查看进度

## 安全说明

- AppSecret 仅存在浏览器 `localStorage`，不会发送到除你自己后端以外的任何地方
- 后端收到 AppSecret 后立即换取 `access_token`，不落库存储
- `access_token` 缓存在内存中，有效期内复用（2小时）
- 生产环境建议对后端接口增加鉴权（如 API Key 校验）


## 常见问题

**Q: 群发失败 errcode 45028**  
A: 每天只能群发 1 篇，改用「保存草稿」模式。

**Q: 上传图片失败 errcode 40007**  
A: media_id 无效，临时素材有效期 3 天，重新上传即可。

**Q: token 获取失败 errcode 40001**  
A: AppSecret 填写有误，或 IP 未加入微信公众平台白名单。

## 联系方式

有问题或建议？欢迎联系：
- **WeChat**：nanacoco

## 使用许可

本项目仅供**个人学习和使用**。

✅ **允许**：
- 个人使用
- 自行修改和扩展
- 在小范围内分享代码

❌ **禁止**：
- 用于商业目的（包括出售、商业部署、代理服务等）
- 未经许可转发或重新发布

如有商业合作需求，请通过微信联系。
