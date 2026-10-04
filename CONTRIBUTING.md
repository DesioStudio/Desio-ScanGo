# 参与贡献

感谢你愿意改进 Desio ScanGo。

## 本地开发

```bash
npm install
npm run dev:cert   # iPhone 调试必须，生成 HTTPS 证书
npm run dev
```

`npm run dev` 会同时起两个服务：手机端页面（5173）和桌面端（Electron）。桌面端里的扫码服务端口是随机分配的，每次启动都可能不同。

如果只在电脑上调试界面、不需要手机连真机摄像头，可以跳过 `npm run dev:cert`，项目会自动回落到 HTTP。

## 提交 Pull Request

- 一个 PR 只做一件事，保持改动聚焦
- 行为发生变化时同步更新 `README.md` 和 `CHANGELOG.md`
- 提交前跑一遍 `npm run lint` 和 `npm run build`
- 涉及手机端摄像头相关改动，请在真机（至少一台 iOS、一台 Android）上验证过再提交

## 代码风格

- 模块保持小而职责清晰
- 桌面端的服务逻辑、输入模拟、界面代码三者分开，不要混在一起
- 不要提交构建产物（`dist/`、`release/`、`certs/` 都已在 `.gitignore` 中）
- 界面文案默认中文，英文文案放在 `translations` 里与中文一一对应

## 报告问题

提 issue 时请附上：

- 系统版本、Node.js 版本
- 手机型号与浏览器（iPhone Safari / Android Chrome）
- 是开发模式还是打包后的安装包
- 桌面端窗口里显示的服务地址（可打码 IP）
