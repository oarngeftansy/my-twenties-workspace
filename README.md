# 我的20代生活 · 项目工作台

网址：https://oarngeftansy.github.io/my-twenties-workspace/

包含 16 项初始任务、22 条灵感、12 份机制草案、10 份 GDD、66 条原始对话和 5 张原图。任务、灵感、机制、文档均可编辑；支持筛选、拖动任务、查看来源以及导入/导出备份。

## 保存方式

GitHub Pages 是工作台的固定入口。独立工作台地址：https://my-twenties-workspace.oarngeftansy.workers.dev 。使用工作台口令登录，与 ChatGPT 账号无关。

- 记录、Kimi K3 对话和内容审查保存在 Cloudflare D1；在不同设备输入同一工作台口令即可继续写。并发编辑通过版本检查防止覆盖。
- 讨论后可生成结论草稿，编辑并确认后新建 GDD 或更新已有记录；写入后自动审查。
- 新建或实质修改记录后自动排队审查；仅改变任务进度不会重复审查。AI 给建议，不替主策决定或修改记录。
- 旧版浏览器记录保留。入口页可下载旧备份，进入云端后点击“导入备份”合并。默认保留同编号云端内容，可选择覆盖。
- 可尝试“打开云端并传递资料”；浏览器登录跳转可能阻止窗口间通信，届时用 JSON 备份导入。
- Kimi 密钥和工作台口令哈希仅配置在 Cloudflare 服务端，不包含在 GitHub 页面或仓库。旧版本公开资料的授权保持不变。

## 开发与发布

```sh
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

Node.js 24。推送到 main 后，GitHub Actions 自动构建并部署 GitHub Pages。
GitHub 仓库 Settings → Pages → Source 使用 GitHub Actions。
页面资源路径由 `vite.pages.config.ts` 的 base 控制；更改仓库名称时需同步修改。

GitHub Pages 构建只包含 `pages/main.tsx` 引用的入口与迁移代码，不部署 D1 或服务器凭据。云端源码位于 `cloud-workspace/`，用 `standalone/worker.mjs` 增加独立口令登录并部署到 Cloudflare Workers；根目录旧版工作台源码保留供查阅。

## 资料与设计状态

原文/原图保留。当前制作进度没有证据证明已开工；初始任务均为待办。资料中的提议、助手建议、已明确内容和待确认项分别标记。
