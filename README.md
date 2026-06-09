# 思绪工坊 · Mind Workshop

白色极简 PWA：决策树、目标 SMART、问题图谱、思维模型、知识画布、收集箱、统计仪表盘、AI 助手。

## 本地运行

```bash
npm install
npm run dev
```

浏览器打开：**http://localhost:3000**

默认 **本地模式**（无需登录），数据保存在浏览器 localStorage。

## 开启账号登录与云端同步

项目已内置 Supabase 登录与按账号隔离的数据存储。按以下步骤操作即可启用：

### 第一步：创建 Supabase 项目

1. 打开 [supabase.com](https://supabase.com) 注册并新建项目
2. 进入 **Project Settings → API**，记下：
   - **Project URL**
   - **anon public** 密钥

### 第二步：执行数据库迁移

在 Supabase 控制台 → **SQL Editor**，**按顺序**执行以下文件中的 SQL：

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_decision_tags_archive.sql
supabase/migrations/003_goal_execution.sql
supabase/migrations/004_decision_manual_fields.sql
supabase/migrations/005_decision_notes.sql
supabase/migrations/006_user_scoped_local_modules.sql
supabase/migrations/007_ai_provider.sql
supabase/migrations/008_goals_schema_repair.sql
```

若创建目标报错 `Could not find the 'goal_type' column`，说明 goals 表不完整或 API 缓存过期：请执行 **008**，或按顺序补跑 **001–008**。

### 第三步：开启邮箱注册

在 Supabase → **Authentication → Providers → Email**：

- 开启 Email 注册
- **开发阶段建议关闭「Confirm email」**，否则注册后需先点邮件链接才能登录

### 第四步：配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
```

保存后**重启** `npm run dev`。

### 第五步：注册并登录

- 注册：`http://localhost:3000/register`
- 登录：`http://localhost:3000/login`

首次登录会自动将本机 localStorage 中的历史数据上传到当前账号。之后所有操作会实时同步到云端。

可在 **设置** 页查看当前账号、手动「重新上传本机数据」或退出登录。

## 数据与账号绑定说明

| 模块 | 云端同步 |
|------|----------|
| 决策、目标、图谱、收集箱、实体关联 | ✅ 已支持 |
| 思考会话、想法种子 | ✅ 已支持 |
| 模型库、理论库、画布、复盘等 | ✅ 登录时上传，写入 `user_misc_data` |
| 主题、布局偏好 | 仅存本机（设备级设置） |

每条云端数据均通过 `user_id` 与登录账号绑定，数据库已启用行级安全（RLS），其他用户无法访问你的数据。

## 路由一览

- 首页：`/home`
- 决策：`/decisions`
- 目标：`/goals`
- 图谱：`/graph`
- 思考：`/thinking`
- 模型：`/models`
- 知识画布：`/canvas`
- 收集箱：`/inbox`
- 统计：`/stats`
- 设置：`/settings`
- AI 助手：`/ai`
- 登录：`/login` · 注册：`/register`

## 部署到 Netlify（已连 Git）

`.env.local` **不会**随 Git 上传，线上必须在 Netlify 控制台单独配置环境变量。

### 1. 在 Netlify 配置环境变量

进入 **Site configuration → Environment variables**，添加：

| 变量名 | 值 | 作用域 |
|--------|-----|--------|
| `NEXT_PUBLIC_AUTH_ENABLED` | `true` | All |
| `NEXT_PUBLIC_SUPABASE_URL` | 你的 Supabase URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 你的 anon 密钥 | All |
| `OPENAI_API_KEY` | （可选） | All |
| `DEEPSEEK_API_KEY` | （可选，DeepSeek） | All |

`NEXT_PUBLIC_*` 会在**构建时**打进前端包，改完后需要重新部署。

### 2. 在 Supabase 配置线上域名

Supabase → **Authentication → URL Configuration**：

- **Site URL**：填你的 Netlify 地址，例如 `https://你的站点.netlify.app`
- **Redirect URLs** 追加：
  - `https://你的站点.netlify.app/**`
  - `https://你的站点.netlify.app/auth/callback`

有自定义域名时，把 `你的站点.netlify.app` 换成自定义域名。

### 3. 推送代码触发部署

```bash
git add .
git commit -m "启用登录与 Netlify 部署配置"
git push
```

Netlify 检测到 Git 推送后会自动 `npm run build` 并发布。可在 **Deploys** 页查看构建日志。

### 4. 验证线上是否生效

部署成功后访问你的 Netlify 地址：

- 顶栏显示「云端模式 · 数据已与账号同步」
- 访问 `/decisions` 未登录会跳转到 `/login`
- `/register` 可注册，`/settings` 显示当前邮箱

### 常见问题

| 现象 | 处理 |
|------|------|
| 线上仍是「本地模式」 | 检查 Netlify 是否设了 `NEXT_PUBLIC_AUTH_ENABLED=true`，并 **Trigger deploy → Clear cache and deploy** |
| 注册/登录报错 | 检查 Supabase Site URL、Redirect URLs 是否包含线上域名 |
| 登录后数据不同步 | 确认 Supabase SQL 迁移 001–006 已全部执行 |

## PWA

`public/manifest.json` 已配置。生产构建后可「添加到主屏幕」。图标请放置于 `public/icons/icon-192.png` 与 `icon-512.png`。
