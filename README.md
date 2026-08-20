# Productivity Tool

一个无需注册、无需登录、可以直接在本机运行的个人生产力工作台。它以四象限任务管理为核心，把任务、专注、习惯、时间记录、复盘和 AI 辅助整合到同一个应用中。

项目同时提供 macOS 常驻桌面小组件和浏览器 PWA。数据默认只保存在当前运行环境，项目不包含云端账号系统，也不会把你的 API Key 写入源码。

## 功能

- 今日行动台：显示待处理任务、完成率和建议优先处理的任务。
- 四象限任务：按“重要/紧急”组织任务，支持拖拽、排序、子任务和重复任务。
- 番茄专注：自定义专注与休息时长、提示音和历史记录。
- 习惯打卡：记录连续打卡天数并查看趋势。
- 时间记录：按类别记录每日投入，并查看分配和趋势。
- 数据看板：查看任务完成率、象限分布和时间统计。
- 复盘与模板：记录每日复盘，保存和复用任务模板。
- 本机备份：导出、恢复和迁移浏览器中的数据。
- BYOK AI：使用自己的 CSTCloud API Key 完成任务分析和 AI 内容生成。
- macOS 小组件：独立于浏览器运行，固定在主屏幕左侧，普通应用打开后会自然覆盖它，并支持折叠和开机启动。
- 小组件统一布局：任务、四象限、看板、复盘、模板、每日一签、番茄专注、习惯打卡和时间记录均适配 430×720 单列窗口。
- 桌面工作台视觉：非四象限页面统一使用冷灰纸面、四象限色轨、线性图标与紧凑信息卡，不依赖 emoji 传达功能。
- PWA：支持安装到桌面，并缓存核心资源供离线使用。

## 实现思路

### 1. 零登录的本地工作区

应用启动后直接进入工作台。内部使用一个只存在于运行时的本机工作区身份兼容原有模块，不创建账号、密码或登录会话。

### 2. 本地优先的数据层

任务、设置、日历、专注记录等数据通过统一的存储模块写入浏览器。IndexedDB 用于持久化和恢复，localStorage 兼容原有数据格式。清除站点数据前应先导出备份。

### 3. 静态模块化前端与桌面壳

网页模式不需要构建工具或后端服务。桌面模式使用 Electron 加载同一套前端与本地数据层：

```text
index.html                  主工作台
script.js                   任务与应用运行时
js/                         复盘、专注、习惯、AI 和存储模块
css/studio-theme.css        工作台视觉系统与响应式布局
css/desktop-widget.css      macOS 紧凑小组件布局
css/desktop-widget-pages.css 各功能页的小组件尺寸与交互适配
css/desktop-widget-redesign.css 桌面工作台统一视觉层
desktop/                    独立窗口、桌面定位、折叠与菜单栏控制
partials/                   延迟加载的功能视图
sw.js                       PWA 离线缓存
```

### 4. 可替换的 AI 接入

AI 请求使用 OpenAI-compatible 的 `chat/completions` 协议。接口固定为：

```text
https://uni-api.cstcloud.cn/v1/chat/completions
```

模型名称可在界面修改。API Key 通过本机设置保存，并由前端安全存储模块加密保存；请求时由应用直接发送给 CSTCloud。

## macOS 桌面小组件（推荐）

需要 Git 和 Node.js 20+：

```bash
cd ~
git clone https://github.com/SunnyXi925/productivity-tool.git
cd productivity-tool
npm install
npm run desktop
```

它会打开一个独立的窄屏小组件，不依赖 Safari、Chrome 或其他浏览器窗口。关闭普通浏览器不会影响它。

- 小组件固定在主屏幕最左侧，处于普通窗口层级；打开其他应用时不会遮挡工作窗口。
- “桌面”：随时把小组件重新定位到主屏幕左侧。
- “—”：折叠为仍然可见的顶部窄条；点击“+”即可恢复，不会消失。
- 菜单栏中的 P 图标可以重新显示小组件；右键菜单可重新定位、折叠/展开、设置开机启动或退出。
- 各页面共用固定页头和六项底部导航；“更多”中的工具页可由左上角返回按钮回到工具列表。

生成可以放进“应用程序”文件夹的 `.app`：

```bash
npm run desktop:pack
open "dist/mac-arm64/Productivity Tool.app"
```

生成可分享的未签名 DMG：

```bash
npm run desktop:build
```

当前机器会生成 Apple 芯片版安装包：

```text
dist/Productivity Tool-2.0.0-arm64.dmg
```

将这个 DMG 发给使用 M1/M2/M3/M4 Mac 的用户即可。Intel Mac 需要单独构建：

```bash
npx electron-builder --mac dmg --x64
```

接收者打开 DMG 后，把应用拖进“应用程序”文件夹即可。安装包不会携带你的 API Key，接收者需要在应用顶部“AI”设置中填写自己的 Key。

本地自行构建的应用未做 Apple 开发者签名。首次启动如被 macOS 拦截，可右键应用选择“打开”；如果仍被阻止，再到“系统设置 → 隐私与安全性”选择“仍要打开”。公开面向大量用户分发时，应使用 Apple Developer ID 签名并完成 notarization 公证。

## 浏览器模式

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

1. 启动桌面小组件，或打开浏览器模式的 `http://localhost:8080`。
2. 点击顶部的“AI”。
3. 确认接口地址为 `https://uni-api.cstcloud.cn/v1`。
4. 填写 CSTCloud 账号可用的模型名称。默认值为 `deepseek-v3`；如果账号使用其他模型，以 CSTCloud 控制台显示的模型 ID 为准。
5. 填写 API Key，点击“保存设置”。

API Key 只保存在当前运行环境，不应写进 `.env`、JavaScript 文件、README 或提交到 GitHub。桌面小组件与普通浏览器的数据目录彼此独立，因此首次切换时需要重新配置。

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
