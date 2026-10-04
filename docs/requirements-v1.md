# Desio ScanGo Requirements v1.0

Desio ScanGo is an open source wireless barcode scanner. Its goal is to turn a phone into a wireless scanner gun for a desktop computer.

## MVP Scope

- Desktop app starts a LAN HTTP server.
- Desktop app shows a QR code containing the phone scanner URL.
- Phone browser opens the scanner without installing a native app.
- Phone camera scans QR codes and common barcodes.
- Scan results are sent to the desktop over WebSocket.
- Desktop simulates keyboard input and optionally presses Enter.

## Technology

- Desktop: Electron, React, WebSocket.
- Mobile: React, Vite, PWA, WebRTC camera, ZXing.
- Transport: JSON over WebSocket.
- Windows input: `WScript.Shell.SendKeys` for the first MVP.
