# Security Policy

[简体中文](SECURITY.md) | English

## Supported Versions

| Version | Security fixes |
| --- | --- |
| 0.1.x | Yes |

## Reporting a Vulnerability

**Please do not report security issues in a public issue.** Use GitHub's private vulnerability reporting on the repository's **Security** tab, or contact the repository owner (DesioStudio) directly through GitHub.

You will get an initial response within 7 days. Please include reproduction steps, the scope of impact, and your network setup (for example: another device on the same Wi-Fi).

## Threat Model and Known Limitations

Desio ScanGo is designed as a **personal productivity tool for a trusted local network**, not as a service for untrusted networks. The limitations below are present in the current version on purpose — please read them before using it.

### 1. No authentication on the LAN

The WebSocket connection between the phone and the desktop has **no pairing token and no device approval**. Any device on the same LAN that knows the service address (the address is encoded in the desktop QR code) can:

- connect and submit forged scan results

On a shared network (office, café, public Wi-Fi) this means someone could inject fake barcodes into your computer. **Mitigation**: use it only on a network you trust. **Planned fix**: pairing tokens and a device allowlist are on the roadmap.

### 2. Keyboard simulation types into whatever window has focus

Scan results are typed into **whichever window currently has focus**. If you are not watching where the focus is, barcode content can end up in a chat app, a search box, or anywhere else — a potential information leak or an unintended action. **Mitigation**: click into the target input field before scanning, or uncheck "Type scan results into the focused window" in the desktop app.

### 3. Self-signed certificate private keys

`certs/` holds the CA private key and the server private key. They **live on your own machine only and must never be committed or distributed** (the directory is already in `.gitignore`). If you suspect the keys leaked, delete `certs/`, run `npm run dev:cert` again, and reinstall the new certificate on your phone. These certificates are for local development only and must not be used for a public-facing service.

### 4. Scan history lives in memory only

Both the desktop history list and the phone state are kept in memory, never written to disk. Everything is cleared when the app exits.

## Privacy

- **Camera frames are decoded locally on the phone** — nothing is recorded, stored, or sent to any external server
- Scan data travels only between your phone and your computer over the LAN — **there is no cloud relay**
- The project collects and uploads no statistics or telemetry
