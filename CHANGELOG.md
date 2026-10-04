# Changelog

## Unreleased

- 修复局域网访问被 302 跳转到 `localhost`，导致手机永远打不开页面的问题：跳转前会把 loopback 地址替换为本机局域网地址。
- 新增 HTTPS 自签证书方案（`npm run dev:cert`），解决 iOS Safari 在局域网非安全来源下禁用摄像头的问题；新增 `GET /ca.pem` 供手机直接下载根证书。
- 手机端 WebSocket 地址按页面协议自动选择 `ws://` / `wss://`，并增加非安全来源提示。
- 修复桌面端二维码不显示：二维码结果改为缓存，IPC handler 提前注册并在窗口就绪后重新广播状态。
- 手机端扫码成功新增提示音与震动反馈，提示音可开关（偏好存 localStorage）。
- 界面全中文：默认语言锁定中文，Electron 应用菜单改为中文。
- 文档：README 重写（项目介绍、适用场景、协议详解）；新增项目起源故事 `docs/story.md`；新增部署指南 `docs/deployment.md`、`SECURITY.md`、`THIRD-PARTY-NOTICES.md`、GitHub Actions CI。以上文档均已提供英文版（`README.en.md`、`docs/story.en.md`、`docs/deployment.en.md`、`SECURITY.en.md`、`CONTRIBUTING.en.md`、`THIRD-PARTY-NOTICES.en.md`），中英双语互链。

## 0.1.0

- Initial MVP project structure.
- Added Electron desktop host with LAN HTTP/WebSocket service.
- Added React/Vite mobile scanner PWA using ZXing.
- Added Windows keyboard input simulation through SendKeys.
