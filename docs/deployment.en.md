# Deployment Guide

[简体中文](deployment.md) | English

This guide is for anyone who wants to run Desio ScanGo **on their own computer**. It takes about ten minutes, and the iPhone certificate part only needs doing once.

> If you only want to look at the interface and do not need a real phone camera, you can skip the certificate section. The app will run over HTTP and nothing else changes.

---

## Before You Start: Why You Must Generate the Certificate Yourself

Browsers enforce a hard rule: **only pages served over `https://` or from `localhost` may access the camera.** A LAN address (`http://192.168.x.x`) is not a secure origin, so on iPhone `navigator.mediaDevices` is simply `undefined` and scanning never starts.

That means HTTPS is mandatory, and HTTPS needs a certificate. A certificate cannot be generated on someone else's machine and copied to you — **it is bound to the LAN IP it was issued for**. Every machine has a different IP, so a copied certificate is rejected by the browser.

The correct approach is therefore: on your own computer, with your own IP, generate it on the spot. This is also why a packaged installer downloaded from the internet cannot use the camera on an iPhone.

Fortunately it is a single command.

---

## 1. Prerequisites

| Item | Requirement | Check with |
| --- | --- | --- |
| OS | Windows (keyboard simulation is Windows-based) | — |
| Node.js | 20 or newer | `node -v` |
| openssl | Used to issue the certificate | `openssl version` |
| Network | Phone and computer on the same Wi-Fi | — |

**No openssl?** Installing [Git for Windows](https://git-scm.com/download/win) brings one (at `Git\mingw64\bin\openssl.exe`). The certificate script finds it automatically; no PATH changes needed.

**Firewall**: Windows may prompt for network access on first launch — choose "Allow access". If the phone can never open the page, check Windows Firewall and make sure **inbound** connections for Node.js and Electron are not blocked (public networks may block them by default).

---

## 2. Get the Code

```bash
git clone <repository-url>
cd Desio-ScanGo
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Generate the HTTPS Certificate

```bash
npm run dev:cert
```

On success you will see something like:

```text
[dev:cert] Generating local CA...
[dev:cert] Issuing server certificate for 192.168.1.23...

Certificate ready:
  server certificate  certs/server-cert.pem
  server private key  certs/server-key.pem
  root certificate    certs/ca.pem  <- install this on your iPhone
```

Everything lands in `certs/` (gitignored, never committed). The certificate is valid for 825 days — the hard maximum iOS accepts for a server certificate.

**After changing Wi-Fi networks or getting a new IP from the router, run this command again** and reinstall the certificate on your iPhone.

---

## 5. Start It

```bash
npm run dev
```

The desktop window opens automatically. Two services run:

| Service | Address | Notes |
| --- | --- | --- |
| Phone page | `https://<your-ip>:5173` | The scanning web page |
| Desktop scan server | `https://<your-ip>:<random-port>` | This is what the QR code points to |

**The scan server port is random on every launch**, so never bookmark an old link — always use the QR code currently shown in the desktop window.

---

## 6. Install the Certificate on iPhone (Once)

### 1. Download it

Open this in Safari on your iPhone (use the port shown in the desktop app):

```text
https://<your-ip>:<port>/ca.pem
```

Safari will warn that the server identity cannot be verified. Tap **Show Details → visit this website**.

### 2. Install the profile

When the install prompt appears, tap **Allow** and follow the steps.

### 3. Turn on trust manually

```text
Settings → General → VPN & Device Management → install the profile
Settings → General → About → Certificate Trust Settings → enable "Desio ScanGo Dev CA"
```

**Step 3 is the one people forget.** Installing the profile without flipping the trust switch leaves Safari refusing the connection — the page will not open, or the camera will do nothing.

---

## 7. Notes for Android

Two options:

- **Recommended**: use HTTPS like iOS. Open `https://<your-ip>:<port>/ca.pem` in Chrome, download the certificate and install it
- **Quick workaround**: open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, enter `http://<your-ip>:5173`, and restart the browser

On Android a successful scan both vibrates and plays a beep. iPhone has no vibration API, so it plays the beep only.

---

## 8. Verification Checklist

Tick everything and your deployment is working:

- [ ] After `npm run dev`, the desktop window shows "Running" with a QR code on the right
- [ ] Scanning the QR code with your phone opens the scanning page (address bar starts with `https://`)
- [ ] Tap "Start scanning", grant camera permission, and live video appears
- [ ] Scan a product barcode and a record shows up in the desktop history list
- [ ] Click into Notepad, scan again, and the barcode number is typed in automatically

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Phone cannot open the QR address | Not on the same Wi-Fi, or firewall blocking | Check that the first three IP segments match; allow inbound Node.js / Electron |
| Address bar starts with `http://` | Certificate generation failed, fell back to HTTP | Check `openssl version` works, re-run `npm run dev:cert` |
| Page opens but "Start scanning" does nothing | Not a secure origin, or trust not enabled | The page will say "Not a secure origin"; confirm the trust switch is on |
| Stopped working after switching Wi-Fi | Certificate is bound to the old IP | Re-run `npm run dev:cert`, reinstall on iPhone |
| Scan results appear in another app | Keyboard input goes to the focused window | Click the target field first; or uncheck "Type scan results into the focused window" |
| Desktop QR area is blank | Service just started, state not broadcast yet | Wait a few seconds; if it stays blank, restart `npm run dev` |
| `npm run dev:cert` says openssl not found | openssl is not installed | Install Git for Windows |

---

## 10. Building an Installer (Optional)

```bash
npm run package
```

This produces `Desio-ScanGo-Setup.exe` under `release/`.

> **Known limitation**: the packaged installer currently ships without a certificate, so it runs over HTTP and **the camera cannot be used on iPhone**. When iOS support matters, run from source as described in this guide.
