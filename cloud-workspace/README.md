# 我的20代生活 · 独立工作台

独立工作台：https://my-twenties-workspace.oarngeftansy.workers.dev

GitHub 固定入口：https://oarngeftansy.github.io/my-twenties-workspace/

工作台使用独立口令登录和 Cloudflare D1 数据库，不依赖 ChatGPT 账号。任务、灵感、机制、GDD、对话与审查记录跨设备共享。正文等实质修改和新增记录会在同一事务中保存并加入审查队列；进度变更不重复审查。CAS revision 拦截过期写入。AI 只给分析建议，只有用户确认结论后才写回项目记录。

Kimi 的 `KIMI_API_KEY` 和工作台登录密钥通过 Cloudflare Workers 服务端 Secret 配置，不放入网页和 Git。模型为 `kimi-k3`。新内容保存后尝试后台审查，打开工作台时继续处理持久队列；关闭页面期间未完成的请求会在回来后恢复。失败可以重试。每个内容版本去重，聊天提交使用幂等 ID，界面显示最近 300 条历史。

对话可以从任务、灵感、机制与 GDD 中选择最多 8 条资料，也可把卡片拖到侧栏“橡皮鸭对话”入口，或在对话页的选择器内拖放。每次发送时把所选记录的当时内容保存为快照，历史对话显示关联记录，模型优先围绕这些资料回复。只选择资料也可以发起一次讨论。

聊天记录、答复、当前草稿和本轮选中资料都保存在 D1。草稿采用修订号防止另一设备的旧页面覆盖新内容；遇到冲突时由用户选择保留哪一版。续聊时模型会收到最近六轮消息及这些消息当时选中的资料摘要。每轮回答可整理成结论草稿，用户核对后写入新 GDD 或已有任务、灵感、机制、GDD。

旧 GitHub 浏览器内容通过 JSON 备份导入；只合并记录，不删除云端独有记录。默认保留同编号云端版本，用户可以选择覆盖。历史 AI 备份只用于归档，不由导入恢复。

开发：`npm ci`、`npm run dev`。构建：`npm run build`。类型检查：`npx tsc --noEmit`。核心验证：`node --experimental-strip-types --test tests/ai-core.test.ts`、`node --test standalone/auth.test.mjs`。独立部署步骤见 `standalone/README.md`。
