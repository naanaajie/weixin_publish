# DeepSeek AI 排版 Prompt 模板库

本目录存放所有排版主题的 AI prompt 模板。

## 文件清单

- `sanlian.txt` — 三联·深墨（克制优雅，深度阅读）
- `sspai.txt` — 少数派·墨绿（精准克制，科技干货）
- `huxiu.txt` — 晚点·深墨蓝（权威感，财经商业）
- `nweekly.txt` — 新周刊·极简（轻盈现代，生活方式）

## 核心原则

**⚠️ 所有 prompt 都严禁修改原文**

每个 prompt 的第一条都明确指出：
- ✅ 只做排版格式调整（分段、加标题、加粗、引用块、列表化）
- ❌ 严禁添加导语、改写句子、改变事实、创作新段落

## 修改 Prompt

直接编辑对应的 `.txt` 文件即可。前端会自动加载最新版本（需要刷新浏览器）。

修改步骤：
1. 编辑 `templates/xxx.txt`
2. 保存文件
3. 在浏览器中刷新页面（Cmd+R 或 Ctrl+R）
4. 选择对应主题并测试

## 前端加载机制

`index.html` 通过 Fetch API 在页面加载时异步读取所有 prompt：

```javascript
async function loadPrompts() {
  const themes = ['sanlian', 'sspai', 'huxiu', 'nweekly'];
  window.THEME_PROMPTS = {};
  for (const theme of themes) {
    const res = await fetch(`/templates/${theme}.txt`);
    window.THEME_PROMPTS[theme] = await res.text();
  }
}
```

## 后端集成

后端服务（`server.js`）可选择也加载这些 prompt，通过 API 返回给其他客户端：

```javascript
// 在 server.js 中
const fs = require('fs');
const prompts = {};
['sanlian', 'sspai', 'huxiu', 'nweekly'].forEach(theme => {
  prompts[theme] = fs.readFileSync(`./templates/${theme}.txt`, 'utf-8');
});
```

## 版本控制

所有 prompt 文件纳入 Git 版本控制，修改历史可追溯：

```bash
git log -- templates/
git diff templates/huxiu.txt
```
