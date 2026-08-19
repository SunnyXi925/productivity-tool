# Productivity Tool

一个无需注册、无需登录、可以直接在本机运行的个人生产力工作台。它以四象限任务管理为核心，把任务、日历、专注、习惯、复盘和 AI 辅助整合到同一个静态 PWA 中。

数据默认只保存在当前浏览器。项目不包含云端账号系统，也不会把你的 API Key 写入源码。

## 功能

- 今日行动台：显示待处理任务、完成率和建议优先处理的任务。
- 四象限任务：按“重要/紧急”组织任务，支持拖拽、排序、子任务和重复任务。
- 日历日程：管理日历事件，并将任务同步到日历。
- 番茄专注：自定义专注与休息时长、提示音和历史记录。
- 习惯打卡：记录连续打卡天数并查看趋势。
- 数据看板：查看任务完成率、象限分布和时间统计。
- 复盘与模板：记录每日复盘，保存和复用任务模板。
- 本机备份：导出、恢复和迁移浏览器中的数据。
- BYOK AI：使用自己的 CSTCloud API Key 完成任务分析和 AI 内容生成。
- PWA：支持安装到桌面，并缓存核心资源供离线使用。

## 实现思路

### 1. 零登录的本地工作区

应用启动后直接进入工作台。内部使用一个只存在于运行时的本机工作区身份兼容原有模块，不创建账号、密码或登录会话。

### 2. 本地优先的数据层

任务、设置、日历、专注记录等数据通过统一的存储模块写入浏览器。IndexedDB 用于持久化和恢复，localStorage 兼容原有数据格式。清除站点数据前应先导出备份。

### 3. 静态模块化前端

项目不需要构建工具或后端服务：

```text
index.html                  主工作台
script.js                   任务与应用运行时
js/                         日历、复盘、专注、AI 和存储模块
css/studio-theme.css        工作台视觉系统与响应式布局
partials/                   延迟加载的功能视图
sw.js                       PWA 离线缓存
```

### 4. 可替换的 AI 接入

AI 请求使用 OpenAI-compatible 的 `chat/completions` 协议。接口固定为：

```text
https://uni-api.cstcloud.cn/v1/chat/completions
```

模型名称可在界面修改。API Key 通过本机设置保存，并由浏览器端安全存储模块加密保存；请求时由浏览器直接发送给 CSTCloud。

## 本机运行

需要 Git、Node.js 20+ 和 Python 3。

在终端中依次执行：

```bash
cd ~
git clone https://github.com/SunnyXi925/productivity-tool.git
cd productivity-tool
npm install
npm run serve
```

然后访问：

```text
http://localhost:8080
```

必须先进入项目目录再执行 `npm run serve`。如果终端提示符仍然显示为 `~ %`，说明你仍在主目录；请先运行：

```bash
cd ~/productivity-tool
```

如果项目已经克隆过，可以更新后启动：

```bash
cd ~/productivity-tool
git pull
npm install
npm run serve
```

按 `Ctrl+C` 停止本机服务。

## 配置 API Key

1. 启动应用并打开 `http://localhost:8080`。
2. 点击页面顶部或今日行动台中的“AI 设置”。
3. 确认接口地址为 `https://uni-api.cstcloud.cn/v1`。
4. 填写 CSTCloud 账号可用的模型名称。默认值为 `deepseek-v3`；如果账号使用其他模型，以 CSTCloud 控制台显示的模型 ID 为准。
5. 填写 API Key，点击“保存设置”。

API Key 只保存在当前浏览器，不应写进 `.env`、JavaScript 文件、README 或提交到 GitHub。更换浏览器后需要重新配置。

## 检查代码

```bash
npm run check
npm run audit:project
```

## 数据与安全边界

- 本项目适合个人、本机和自托管使用。
- 它没有服务器端账号、数据库或多用户权限隔离。
- 浏览器端加密可以减少明文暴露，但不能替代服务端 AI 代理。
- 如果要公开给多人使用，应增加服务端鉴权、数据库、限流和 AI Proxy。

## 来源与许可

项目基于 [XXSG-OpenSource](https://github.com/wangyuanhao666/XXSG-OpenSource) 进行二次开发，并保留原项目的 MIT License。详见 [LICENSE](LICENSE)。
