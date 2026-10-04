# Desio ScanGo

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Platform](https://img.shields.io/badge/Platform-Windows-blue.svg)
![Node](https://img.shields.io/badge/Node-%E2%89%A520-brightgreen.svg)
![Electron](https://img.shields.io/badge/Electron-38-purple.svg)

[简体中文](README.md) | English

**Turn your phone into a wireless barcode scanner for your computer.**

Scan the QR code shown in the desktop app, the scanner page opens in your phone browser, point the camera at a barcode, and the value lands on your computer instantly. No app to install on the phone, no server in between.

![Desktop app](docs/images/desktop-ui.png)

![Phone scanner](docs/images/mobile-ui.png)

Its origin is a childhood dream about convenience stores — [Why I Built Desio ScanGo](docs/story.en.md).

Every document in this repository is available in Chinese and English. If a page you open is in Chinese, look for the language switch on its first line.

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Where it fits](#where-it-fits)
- [Versus a hardware scanner](#versus-a-hardware-scanner)
- [Features](#features)
- [Supported barcode formats](#supported-barcode-formats)
- [How it works](#how-it-works)
- [Quick start](#quick-start)
- [Using the desktop app](#using-the-desktop-app)
- [iPhone: install the certificate once](#iphone-install-the-certificate-once)
- [Android](#android)
- [Troubleshooting](#troubleshooting)
- [Giving it to someone else](#giving-it-to-someone-else)
- [Project structure](#project-structure)
- [Development](#development)
- [Roadmap](#roadmap)
- [The longer-term idea](#the-longer-term-idea)
- [Security and privacy](#security-and-privacy)
- [Contributing](#contributing)
- [License](#license)

---

## Why this exists

### It started with a convenience store dream

The first time I watched a cashier scan a product, it felt like magic: hold the barcode in front of a device, and the computer knows what it is, shows the price, closes the sale. I remember thinking that running my own little store and scanning like a real cashier would be wonderful.

Years later I actually built one. I found a free and open source point-of-sale system, paired it with software that connected a phone to a computer, and ran a checkout flow at home: phone scans the barcode, the value travels to the computer, the POS recognises the product — a real store checkout, reproduced on a desk. That was the first time I felt that ordinary devices, combined through software, could become a complete business system.

Then that phone scanner software was abandoned. When I went looking for a replacement, most apps only scanned for the phone itself, most tools required specific hardware, and almost nothing simple and open source could genuinely stand in for a scanner gun.

At some point the obvious question arrived: why not build one myself?

> Full story: [Why I Built Desio ScanGo](docs/story.en.md).

### Setting the nostalgia aside, what it actually solves

If you want a computer to read barcodes, you usually have two options, and neither is great.

**Buy a dedicated scanner gun.** A few hundred yuan, one USB port occupied, a cable in the way, and a replacement to buy when it breaks. Yet almost all of them are just keyboards — once plugged in, they do exactly what typing those digits would do.

**Scan on your phone, then get the value to the computer somehow.** Send it over chat, email it to yourself, copy to clipboard, switch windows, paste. Fun for three items, miserable for thirty.

Since a scanner gun is essentially a keyboard, the phone in your pocket can do the job. That is the whole idea behind Desio ScanGo: the phone sees, the computer receives, and everything stays on your own network.

The phone side is a web page, not an app — nothing to install, nothing to update, no app store permissions. Scan, use, close.

## Where it fits

| Situation | How you would use it |
| --- | --- |
| Warehouse or stocktaking | Put the cursor in an Excel cell, walk the shelves with your phone, enable "press Enter after each scan" to move down a row |
| Small shop restocking | Click into the search box of your ERP, scan the product, get the record |
| Books, archives, fixed assets | Enter long identifier numbers far faster than typing, without typos |
| Inbound / outbound checking | Watch the history list on the desktop while scanning to see what has been counted |
| Development and testing | Fill forms that need barcode values without typing fifteen digits by hand |

And, to be fair, **where it does not fit**:

- industrial, high-throughput scanning lines — phones are not built for that duty cycle
- harsh environments that need rugged, dust-proof, drop-proof hardware
- scenarios with dozens of people scanning at once — there is no concurrency or permission model yet

## Versus a hardware scanner

| | Desio ScanGo | Hardware scanner |
| --- | --- | --- |
| Cost | free if you own a phone | from a few hundred yuan |
| Setup | scan a QR code, done | plug in, sometimes drivers |
| Multiple devices | several phones can feed one computer | usually one to one |
| Mobility | walk anywhere, no cable | limited by cable length |
| Maintenance | software updates | replace broken hardware |
| Offline | needs a local network, not the internet | fully offline |
| Durability | depends on your phone | industrial models win |

In one sentence: **it replaces the "I need to scan a few things now and then" use case**, it does not retire professional equipment.

## Features

- **Nothing to install on the phone** — scan the pairing QR code and start scanning
- **Realtime delivery** — a WebSocket connection carries each scan over in milliseconds
- **Automatic typing** — results can be typed into the focused window, optionally followed by Enter
- **Several phones at once** — multiple people can scan into the same computer, tagged per device
- **Scan history** — the service keeps the last 50 scans, the window shows the latest 20 with value, format and time
- **Scan feedback** — beep and vibration on success, with a toggle for the sound
- **HTTPS support** — a built-in self-signed certificate flow so iOS Safari grants camera access on the LAN
- **Chinese and English** — Chinese by default, one click to switch; the app menu is localised too
- **Completely local** — data moves only between your phone and your computer. No cloud, no telemetry, no accounts

## Supported barcode formats

Formats enabled in this version:

| Format | Typical use |
| --- | --- |
| EAN-13 | retail products (most packaging in China) |
| EAN-8 | small packages |
| UPC-A / UPC-E | North American retail |
| Code 128 | logistics, warehousing, shipping labels |
| Code 39 | industrial and asset tags |
| QR Code | 2D codes |

Decoding is done by [ZXing](https://github.com/zxing-js/library), entirely inside the phone browser. Enabling ITF, Codabar, Data Matrix or PDF417 is a one-line change to the decode hints (see [Roadmap](#roadmap)).

## How it works

```text
Phone camera → decoded locally (ZXing) → WebSocket → desktop app → keyboard input / history
```

1. The desktop app starts a LAN service (HTTP or HTTPS + WebSocket) bound to `0.0.0.0`
2. It renders the service address as a QR code in the window
3. The phone scans it, the page opens, the browser asks for camera permission and starts decoding
4. Every successful scan is sent back over the WebSocket
5. The desktop app decides, per your settings, whether to type it, whether to append Enter, and records it in the history

**The scan service port is assigned randomly** on every start, so do not bookmark it — always use the QR code currently shown in the desktop window.

Stack:

| Layer | Technology |
| --- | --- |
| Desktop shell | Electron |
| Desktop UI | React + Vite |
| Phone scanner | React + Vite + ZXing |
| LAN service | Express + ws |
| Keyboard simulation | Windows `WScript.Shell.SendKeys` |

## Quick start

### Requirements

| Item | Requirement |
| --- | --- |
| OS | Windows (keyboard simulation is Windows based) |
| Node.js | 20 or newer |
| Network | phone and computer on the **same WiFi / LAN** |
| Certificate | openssl, used to generate the HTTPS certificate |

### Install and run

```bash
npm install
npm run dev:cert   # generate the HTTPS certificate (re-run when the LAN IP changes)
npm run dev
```

The desktop window opens by itself, shows "Running" in the top right and the pairing QR code on the right.

Two services start:

| Service | Address | Purpose |
| --- | --- | --- |
| Phone page | `https://<your IP>:5173` | Vite dev server |
| Scan service | `https://<your IP>:<random port>` | what the QR code points at |

## Using the desktop app

Four areas:

- **Top bar**: run state, service address, language switch
- **Pairing**: the QR code and the address. The phone scans here
- **Devices and keyboard**: connected phones, plus two toggles —
  - *Type scans into the active window*: turn it off to record without typing
  - *Press Enter after each scan*: handy for filling Excel row by row
- **Scan activity**: the latest scans with value, format and time

**Typing goes to whatever window currently has focus.** Click into the target input first, then scan. Turn the toggle off if you only want the log.

## iPhone: install the certificate once

iOS Safari enforces a hard rule: **the camera is only available on `https://` or `localhost`**. A LAN address such as `http://192.168.x.x` is not a secure origin, so `navigator.mediaDevices` is simply undefined and scanning never starts.

Android Chrome can be talked out of it with a flag. iOS has no such switch, which leaves HTTPS with a self-signed certificate — that is why `npm run dev:cert` exists.

You install it once and it stays valid (825 days, the maximum iOS accepts for a server certificate).

### Steps

**1. Download it**

Open Safari on the iPhone and go to (the port is shown in the desktop app, it changes every start):

```text
https://192.168.x.x:<port>/ca.pem
```

Safari warns that the identity cannot be verified. Tap *Show details* → *visit this website*.

**2. Install the profile**

Allow the profile download and follow the prompts.

**3. Enable full trust (the step everyone forgets)**

```text
Settings → General → VPN & Device Management → install the profile
Settings → General → About → Certificate Trust Settings → enable "Desio ScanGo Dev CA"
```

**Safari only trusts the certificate after step 3.** Installing the profile without flipping that switch still leaves Safari refusing the connection.

### When your IP changes

The certificate is issued for the LAN IP that existed when it was created. After changing WiFi, or when the router hands out a new address, issue it again:

```bash
npm run dev:cert
```

Restart the dev server and install the new certificate on the iPhone.

## Android

Two options with Chrome:

- **Recommended**: same as iOS. Visit `https://<your IP>:<port>/ca.pem`, download and install the certificate
- **Quick workaround**: open `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, enter `http://<your IP>:5173`, restart the browser

Android vibrates and beeps on a successful scan. iPhones have no vibration API, so they only beep.

## Troubleshooting

**The phone cannot open the QR address**

Make sure both devices are on the same WiFi and share the first three octets of the IP. Check that Windows Firewall is not blocking Node.js or Electron inbound (the Public profile often does). AP isolation or a guest network will also keep devices from seeing each other.

**The page opens but scanning does nothing**

Almost always a secure origin problem, or a certificate that was not trusted. The page itself says "Not a secure origin, so the camera is blocked" — follow the certificate steps above.

**Scans land in a chat window or somewhere unexpected**

Typing goes to the focused window. Click into the target input before scanning, or switch off "Type scans into the active window" and keep only the log.

**The scan service port keeps changing**

By design. Use the QR code currently displayed instead of a saved link.

**openssl is missing**

`npm run dev:cert` needs it. On Windows, installing Git for Windows brings one along (`Git\mingw64\bin\openssl.exe`). Without it the whole project falls back to HTTP — everything still works, except the camera on iOS.

**Antivirus complains**

Keyboard simulation goes through the Windows built-in `WScript.Shell.SendKeys`, the same mechanism a USB scanner gun uses. Nothing is recorded or logged; allow-list it if your security software is sensitive to that API.

## Giving it to someone else

| Who | How | Status |
| --- | --- | --- |
| The phone doing the scanning | nothing to install, scan the QR code | works today |
| Someone who wants it on their own computer | follow the [deployment guide](docs/deployment.en.md) and generate the certificate **on their machine** | recommended |
| Someone who wants an installer | `npm run package` produces an exe | limited, see below |

### Why the source route beats shipping an installer

The HTTPS certificate is bound to the LAN IP that existed when it was issued. Every machine has a different IP, so a certificate has to be generated on the machine that uses it — copying one over does not work.

With the source route, `npm run dev:cert` issues a certificate for the current machine and the iPhone works properly. See [docs/deployment.en.md](docs/deployment.en.md) for the full walkthrough, roughly ten minutes.

> **Known limitation**: the packaged installer currently ships without a certificate and therefore runs over HTTP, which means **the camera will not work on iPhone in the packaged build**. Making it generate a certificate on first launch is planned; until then, point users at the deployment guide.

## Project structure

```text
desktop/
  electron/    Electron main and preload (app menu, IPC, window)
  input/       Windows keyboard input adapter
  server/      LAN HTTPS/WebSocket service, QR generation
  src/         Desktop renderer (React)
mobile/
  src/         Phone scanner web app (React + Vite + ZXing)
scripts/
  generate-dev-cert.mjs   self-signed CA and server certificate generator
.github/
  workflows/   CI: lint and build on push / PR
docs/
  requirements, deployment guide, stories (both languages), screenshots
```

## Development

```bash
npm run dev        # start dev services (phone 5173 + desktop)
npm run dev:cert   # generate / regenerate the HTTPS certificate
npm run lint       # lint
npm run build      # build frontend bundles
npm run package    # build the Windows installer into release/
```

See [CONTRIBUTING.en.md](CONTRIBUTING.en.md) for style and pull request expectations.

## Roadmap

This version is a working MVP. What comes next:

- **Pairing tokens and device approval** — right now anyone on the LAN can submit scans (see [SECURITY.en.md](SECURITY.en.md))
- **Certificate generation in the packaged build** — so the installer works with iPhone too
- **More barcode formats** — ITF, Codabar, Data Matrix, PDF417, as checkboxes
- **Prefixes, suffixes and output templates** for scanned values
- **History export** to CSV
- **Cross-platform input** for macOS and Linux

Ideas and pull requests are welcome.

## The longer-term idea

Scanning is only the starting point. What this project really wants to explore is **how the ordinary devices already in our hands can gain new abilities through software**.

Along that line, a phone could become:

- an OCR text input device
- a wireless webcam for the computer
- an AI vision capture terminal
- more broadly, a wireless extension of your computer

Years ago I thought a scanner gun was a magical piece of professional equipment. Later I realised the magic is not in the scanner — it is in the fact that software can redefine what an ordinary device can do. If that resonates with you, come and talk.

## Security and privacy

**Privacy**: camera frames are decoded locally on the phone and never recorded, stored or uploaded. Scan values travel only between your phone and your computer over the local network. There is no cloud relay, no telemetry and no account system.

**Security**: Desio ScanGo is built for **trusted local networks**. This version has no pairing token and no device approval, so anyone who can reach the address (the address is right there in the QR code) can submit fake scans. On an untrusted network, that means someone could inject barcodes into your computer. The full threat model and how to report vulnerabilities privately are in [SECURITY.en.md](SECURITY.en.md).

The certificate is for local development only. The `certs/` directory — which contains private keys — is never committed and must never be shipped. Do not use these certificates to serve anything publicly.

## Contributing

Bug reports, feature ideas, documentation fixes and code are all welcome.

- Search existing issues before opening a new one
- Read [CONTRIBUTING.en.md](CONTRIBUTING.en.md) for the local setup, style and PR expectations
- Changes touching the phone camera should be verified on a real device before submitting

Thank you to everyone who contributes.

---

## License

This project is released under the **MIT License**, one of the most permissive open source licences. The full legal text is in [LICENSE](LICENSE).

### What you may do

| | Allowed |
| --- | --- |
| Personal use | yes |
| Commercial use | yes, free of charge |
| Modify the source | yes |
| Distribute / republish | yes |
| Include in a closed-source commercial product | yes |
| Sell copies | yes |
| Sublicense | yes |

### What you must do

**Exactly one thing**: include the original copyright notice and this permission notice in all copies or substantial portions of the software.

You may turn it into your own product and sell it, as long as you credit the original copyright somewhere reasonable — a LICENSE file or an About page. You do not have to open source your changes, notify the author, or display attribution in the UI.

### What you may not do

- **Demand a warranty**: the software is provided "as is", without warranty of any kind, express or implied, including but not limited to merchantability, fitness for a particular purpose and non-infringement
- **Hold anyone liable**: in no event shall the authors or copyright holders be liable for any claim, damages or other liability, whether in contract, tort or otherwise
- **Use the trademark**: the MIT License grants **no trademark rights**. The name "Desio ScanGo" and the project's marks are outside the licence; please avoid implying official endorsement or origin

### Copyright

```text
Copyright (c) 2026 wsd20021030
```

### Third-party components

Every component this project depends on uses a permissive licence (MIT / ISC). **There are no GPL, LGPL or AGPL components**, so you can safely use it inside closed-source commercial work without copyleft obligations.

The full list and what each is used for lives in [THIRD-PARTY-NOTICES.en.md](THIRD-PARTY-NOTICES.en.md).

One thing worth noting: the packaged desktop app embeds the Electron runtime, which bundles Chromium and Node.js. Their licence notices ship with the Electron binaries (see `LICENSE` and `LICENSES.chromium.html` in the Electron installation) and should be kept when you redistribute binaries.

Questions about how the licence applies are welcome as an issue — you do not need to be a lawyer to ask.
