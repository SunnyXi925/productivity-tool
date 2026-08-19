# 象限时光 · 本机生产力工作台

一个零登录、本地优先的个人生产力 PWA。打开页面即可使用，任务、日历、习惯、番茄钟与复盘数据默认保存在当前浏览器。

本项目基于 [XXSG-OpenSource](https://github.com/wangyuanhao666/XXSG-OpenSource) 二次设计与开发，继续遵循 MIT License。

## 主要能力

- 四象限任务：按轻重缓急组织、拖拽与排序任务。
- 今日行动台：汇总待办、完成率，并给出下一项优先任务。
- 日历与专注：日程、番茄钟、倒数日、习惯打卡和时间统计。
- 复盘与模板：保存常用任务结构，记录每日复盘。
- 本地备份：导出、恢复浏览器中的个人数据。
- BYOK AI：在主界面配置自己的 API Key，支持任务分析与 AI 签语。

## 直接运行

需要 Node.js 20+ 和 Python 3。

```bash
git clone https://github.com/SunnyXi925/productivity-tool.git
cd productivity-tool
npm install
npm run serve
```

打开 [http://localhost:8080](http://localhost:8080)。无需注册或登录。

## AI 配置

在工作台点击“AI 设置”，填写：

- 接口地址：`https://uni-api.cstcloud.cn/v1`
- 模型名称：默认为 `deepseek-v3`，可按账号可用模型修改
- API Key：仅加密保存在当前浏览器

实际聊天补全请求发送至：

```text
https://uni-api.cstcloud.cn/v1/chat/completions
```

不要把 API Key 写入源码或提交到仓库。

## 数据说明

这是单机工具，不提供账号系统或跨设备云同步。清除浏览器数据、更换浏览器或更换设备前，请先导出备份。

## 开发检查

```bash
npm run check
npm run audit:project
```

## License

MIT License。详见 [LICENSE](LICENSE)。
