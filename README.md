# 思绪工坊 · Thought Workshop

白色极简 PWA：决策树、目标 SMART、问题图谱、思维模型、知识画布、收集箱、统计仪表盘、AI 助手。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开：**http://localhost:3000**（默认进入决策页，**无需登录**）

当前为 **本地模式**（`src/lib/config.ts` 中 `AUTH_ENABLED = false`），数据保存在浏览器 localStorage。

若要稍后开启登录与 Supabase 同步：

1. 将 `AUTH_ENABLED` 改为 `true`
2. 配置 `.env.local` 中的 Supabase 变量
3. 执行 `supabase/migrations/001_initial_schema.sql`

- 登录/注册（需开启 AUTH）：`/login` `/register`
- 决策：`/decisions`
- 目标：`/goals`
- 图谱：`/graph`
- 模型：`/models`
- **知识画布**：`/canvas`
- 收集箱：`/inbox`
- 统计：`/stats`
- 设置（OpenAI Key）：`/settings`

## Supabase

1. 创建 Supabase 项目
2. 在 SQL Editor 执行 `supabase/migrations/001_initial_schema.sql`
3. Authentication 开启 Email 注册
4. 将 URL/Key 写入 `.env.local`

## PWA

`public/manifest.json` 已配置。生产构建后可「添加到主屏幕」。图标请放置于 `public/icons/icon-192.png` 与 `icon-512.png`。

## 知识画布

画布子模块位于 `src/app/canvas/`，当前以 localStorage 自动保存；后续可对接 `canvas_vaults` 表实现云端同步。
