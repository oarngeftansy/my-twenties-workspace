# 我的20代生活 · 项目工作台

网址：https://oarngeftansy.github.io/my-twenties-workspace/

包含 16 项初始任务、22 条灵感、12 份机制草案、10 份 GDD、66 条原始对话和 5 张原图。任务、灵感、机制、文档均可编辑；支持筛选、拖动任务、查看来源以及导入/导出备份。

## 保存方式

这是 GitHub Pages 静态版。项目资料和原始附件已获项目所有者许可公开。

- 修改只保存在当前浏览器的本地存储，不会写入 GitHub，也不跨设备同步。
- 不同访客的修改相互独立。清除站点数据、更换浏览器或设备后，需要导入备份。
- 使用“导出备份”保存 JSON 文件；使用“导入备份”恢复。导入前会显示数量并要求确认，替换前自动下载当前备份。
- 原有私有云端工作台独立保留，两者不会自动同步；它导出的 version 1 JSON 备份也可导入此站。
- 部署更新不会覆盖此浏览器已经保存的内容。

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

原 Sites 服务器相关文件保留用于查阅，GitHub Pages 构建只包含 `pages/main.tsx` 引用的客户端代码，不部署 D1 接口或任何服务器凭据。

## 资料与设计状态

原文/原图保留。当前制作进度没有证据证明已开工；初始任务均为待办。资料中的提议、助手建议、已明确内容和待确认项分别标记。
