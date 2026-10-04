# Third-Party Notices

[简体中文](THIRD-PARTY-NOTICES.md) | English

Desio ScanGo builds on the open-source components below — thanks to every one of their authors. All dependencies use permissive licences (MIT / ISC), which are compatible with the MIT licence this project uses.

## Runtime Dependencies

| Component | Version | Licence | Used for |
| --- | --- | --- | --- |
| react | 19.3.0 | MIT | Desktop and phone UI |
| react-dom | 19.3.0 | MIT | Rendering |
| @zxing/browser | 0.1.5 | MIT | Camera barcode decoding |
| @zxing/library | 0.21.3 | MIT | Barcode / QR decoding core |
| lucide-react | 0.544.0 | ISC | UI icons |
| express | 5.2.1 | MIT | Local HTTP server |
| ws | 8.22.0 | MIT | WebSocket transport |
| qrcode | 1.5.4 | MIT | Pairing QR generation |

## Build and Desktop

| Component | Licence | Notes |
| --- | --- | --- |
| electron | MIT | Desktop runtime; bundles Chromium and Node.js |
| electron-builder | MIT | Windows installer packaging |
| vite / @vitejs/plugin-react | MIT | Frontend build |

Electron bundles Chromium and Node.js. Their respective licence notices ship with the Electron binary (see `LICENSE` and `LICENSES.chromium.html` in the Electron install directory) and are acknowledged here as well.

## Licence Texts

The full licence text of each component can be found in its source repository or at `node_modules/<component>/LICENSE`. This file is only a summary; where it conflicts with the original licence text, the original text prevails.
