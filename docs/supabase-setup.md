# 开启注册和曲目评论

前端已经接入现有的 Supabase 项目 `skneweesbyybsuggsvyw`。数据库管理操作需要项目所有者权限，网页的 publishable key 不能执行迁移。

## 1. 建立评论表

在这个项目的 **SQL Editor** 新建查询，完整复制并运行：

[`supabase/migrations/202611160001_listening_comments.sql`](../supabase/migrations/202611160001_listening_comments.sql)

这份脚本可重复执行，不修改现有进度表或管理员激活逻辑。它会建立评论表、索引、提交触发器和 RLS 规则：

- 所有人可以阅读评论；只有已登录的用户可以发布。
- 曲目编号必须为 1–160，评论正文为 1–2000 字。
- 作者 ID 由数据库从登录会话获取，公开昵称从注册时填写的用户资料获取。客户端不能冒充其他作者或指定评论时间。
- 用户只能删除自己的评论，不能修改其他人的内容。
- 同一账号每 15 秒最多发布一条评论。管理员可在 Supabase Dashboard 管理违规内容。
- 评论表不会存储或公开邮箱。昵称与评论内容对所有访问者可见。

如果此前已经自行建立过同名表，先核对它的结构和已有策略，再执行迁移；这份脚本不会删除已有评论。

## 2. 开启邮箱注册

在 **Authentication → Sign In / Providers**（界面也可能称 **Providers**）中启用 **Email**，并允许新用户注册（**Allow new users to sign up**）。建议保留确认邮箱选项。测试邮件发送受到 Supabase 邮件配额限制；面向真实用户开放时，按项目需求配置自己的 SMTP。

在 **Authentication → URL Configuration** 配置：

- **Site URL**：`https://zchang592.github.io/qelisteninglist/`
- **Redirect URLs**：`https://zchang592.github.io/qelisteninglist/`
- 本地开发可另加 `http://127.0.0.1:8765/` 和 `http://localhost:8765/`。

无需把 service-role key、数据库密码或其他管理密钥放进 HTML、GitHub Pages 或聊天中。

## 3. 验证真实流程

1. 打开线上页面，选择“登录 / 注册 → 创建账号”，填写昵称、邮箱和密码。
2. 收到确认邮件后打开其中链接，确认返回本站。
3. 登录后打开任意曲目的“讨论”，发布一条评论。刷新页面，重新打开同一曲目，确认评论仍在。
4. 在未登录窗口查看同一曲目，应能阅读评论，但不能发言或删除。
5. 使用另一个账号验证不能删除第一位用户的评论；原作者可以删除自己的评论。
6. 确认普通账号仍无法修改全库共享进度和备注。已有管理员继续使用原来的账号与激活机制。

如果弹窗提示“评论服务尚未启用”，请确认迁移在正确的项目运行成功。如果登录正常但评论发布失败，请检查浏览器返回的错误、数据库权限规则和项目状态。

## 4. 云环境访问

真实联调需要云环境允许访问：

- `skneweesbyybsuggsvyw.supabase.co`：账户、进度、评论 API。
- `itunes.apple.com`：录音片段查询；`*.mzstatic.com`：实际音频片段（由平台返回具体子域名）。
- `zchang592.github.io`：核对线上页面。
- `www.youtube.com`、`open.spotify.com`：核对外部曲目搜索。

环境配置草稿的保存与应用、发布是不同步骤。浏览器测试会替换这些外部响应，因此通过测试不代表线上数据库已经启用。
