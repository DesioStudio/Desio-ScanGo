# 第三方组件声明（THIRD-PARTY NOTICES）

简体中文 | [English](THIRD-PARTY-NOTICES.en.md)

Desio ScanGo 依赖以下开源组件，感谢这些项目的作者。所有依赖均采用宽松许可证（MIT / ISC），与本项目使用的 MIT 许可证兼容。

## 运行时依赖

| 组件 | 版本 | 许可证 | 用途 |
| --- | --- | --- | --- |
| react | 19.3.0 | MIT | 桌面端与手机端界面 |
| react-dom | 19.3.0 | MIT | 界面渲染 |
| @zxing/browser | 0.1.5 | MIT | 摄像头扫码解码 |
| @zxing/library | 0.21.3 | MIT | 条码/二维码解码核心 |
| lucide-react | 0.544.0 | ISC | 界面图标 |
| express | 5.2.1 | MIT | 局域网 HTTP 服务 |
| ws | 8.22.0 | MIT | WebSocket 通信 |
| qrcode | 1.5.4 | MIT | 配对二维码生成 |

## 构建与桌面端

| 组件 | 许可证 | 说明 |
| --- | --- | --- |
| electron | MIT | 桌面端运行时，内含 Chromium 与 Node.js |
| electron-builder | MIT | Windows 安装包打包 |
| vite / @vitejs/plugin-react | MIT | 前端构建 |

Electron 打包了 Chromium 与 Node.js，它们各自的许可声明随 Electron 二进制分发（见 Electron 安装目录中的 `LICENSE` 与 `LICENSES.chromium.html`），在此一并致谢。

## 许可证文本

各组件的完整许可证文本可以在其源代码仓库或 `node_modules/<组件名>/LICENSE` 中查阅。本文件仅为摘要，如与原许可证文本冲突，以原文为准。
