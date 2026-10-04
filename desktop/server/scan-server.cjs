const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');
const { randomUUID } = require('node:crypto');
const express = require('express');
const { WebSocketServer } = require('ws');
const QRCode = require('qrcode');

const DEFAULT_PORT = 0;
const CERT_DIR = path.join(__dirname, '../../certs');

// Phone browsers only expose the camera on a secure origin, so a self-signed
// certificate (created by `npm run dev:cert`) upgrades everything to https.
function loadTlsOptions() {
  const certPath = path.join(CERT_DIR, 'server-cert.pem');
  const keyPath = path.join(CERT_DIR, 'server-key.pem');
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) return null;
  try {
    return { cert: fs.readFileSync(certPath), key: fs.readFileSync(keyPath) };
  } catch {
    return null;
  }
}

function getLanAddress() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

// A URL like http://localhost:5173 is meaningless on the phone, so the loopback
// host must be swapped for the LAN address before it is handed to a client.
function toLanUrl(url, lanAddress, protocol) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (LOCAL_HOSTNAMES.has(parsed.hostname)) {
      parsed.hostname = lanAddress;
    }
    if (protocol) {
      parsed.protocol = protocol;
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function normalizeScanMessage(raw, remoteAddress) {
  const parsed = JSON.parse(raw.toString());
  if (parsed.type !== 'barcode' || typeof parsed.value !== 'string' || parsed.value.trim() === '') {
    throw new Error('Invalid scan message.');
  }

  return {
    id: randomUUID(),
    type: parsed.type,
    value: parsed.value.trim(),
    format: parsed.format || 'unknown',
    time: parsed.time || new Date().toISOString(),
    deviceId: parsed.deviceId || remoteAddress || 'unknown-device'
  };
}

async function createScanServer({ mobileDevServerUrl, onStateChange, onScan }) {
  const app = express();
  const tlsOptions = loadTlsOptions();
  const secure = Boolean(tlsOptions);
  const server = secure ? https.createServer(tlsOptions, app) : http.createServer(app);
  const clients = new Map();
  const history = [];
  const lanAddress = getLanAddress();

  // The QR image is cached so a late query still gets one. The first broadcast
  // fires before the window exists, so getState() must never return null.
  let cachedQrDataUrl = null;
  let cachedQrTarget = '';

  async function getQrDataUrl(mobileUrl) {
    if (cachedQrDataUrl && cachedQrTarget === mobileUrl) return cachedQrDataUrl;
    cachedQrDataUrl = await QRCode.toDataURL(mobileUrl, {
      margin: 1,
      width: 256,
      color: {
        dark: '#111111',
        light: '#ffffff'
      }
    });
    cachedQrTarget = mobileUrl;
    return cachedQrDataUrl;
  }

  const mobileBaseUrl = toLanUrl(mobileDevServerUrl, lanAddress, secure ? 'https:' : null);
  const caPath = path.join(CERT_DIR, 'ca.pem');

  // Lets the phone download the root certificate straight from the LAN, which
  // is the only way iOS will trust the self-signed dev server.
  if (fs.existsSync(caPath)) {
    app.get('/ca.pem', (_req, res) => {
      res.type('application/x-x509-ca-cert');
      res.sendFile(caPath);
    });
  }

  if (mobileBaseUrl) {
    app.get('/', (_req, res) => {
      res.redirect(mobileBaseUrl.replace(/\/$/, '') + `/?host=${encodeURIComponent(lanAddress)}&port=${server.address().port}`);
    });
  } else {
    const mobileDist = path.join(__dirname, '../../mobile/dist');
    app.use(express.static(mobileDist));
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(mobileDist, 'index.html'));
    });
  }

  const wss = new WebSocketServer({ server, path: '/ws' });

  function getState() {
    const address = server.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    const mobileUrl = `${secure ? 'https' : 'http'}://${lanAddress}:${port}`;
    return {
      running: Boolean(port),
      host: lanAddress,
      port,
      secure,
      mobileUrl,
      devices: Array.from(clients.values()).map((client) => ({
        id: client.id,
        name: client.name,
        connectedAt: client.connectedAt
      })),
      history: history.slice(0, 20),
      qrDataUrl: cachedQrTarget === mobileUrl ? cachedQrDataUrl : null
    };
  }

  async function emitState() {
    const state = getState();
    state.qrDataUrl = await getQrDataUrl(state.mobileUrl);
    onStateChange?.(state);
  }

  wss.on('connection', (socket, request) => {
    const id = randomUUID();
    const remoteAddress = request.socket.remoteAddress;
    const client = {
      id,
      name: 'Phone',
      connectedAt: new Date().toISOString()
    };
    clients.set(socket, client);
    socket.send(JSON.stringify({ type: 'hello', deviceId: id }));
    emitState();

    socket.on('message', async (raw) => {
      try {
        const message = JSON.parse(raw.toString());
        if (message.type === 'device') {
          client.name = message.name || client.name;
          socket.send(JSON.stringify({ type: 'device:accepted', deviceId: id }));
          await emitState();
          return;
        }

        const scan = normalizeScanMessage(raw, remoteAddress);
        scan.deviceId = id;
        history.unshift(scan);
        history.splice(50);
        await onScan?.(scan);
        socket.send(JSON.stringify({ type: 'scan:accepted', scanId: scan.id }));
        await emitState();
      } catch (error) {
        socket.send(JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : String(error)
        }));
      }
    });

    socket.on('close', () => {
      clients.delete(socket);
      emitState();
    });
  });

  await new Promise((resolve) => server.listen(DEFAULT_PORT, '0.0.0.0', resolve));
  await emitState();

  return {
    getState,
    refresh: () => emitState(),
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

module.exports = { createScanServer };
