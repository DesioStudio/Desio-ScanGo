#!/usr/bin/env node
/**
 * Generates a local CA plus a server certificate so the phone can reach the
 * dev servers over HTTPS. iOS Safari only grants camera access (secure context)
 * on https origins, and it refuses plain http on a LAN address.
 *
 * Usage: npm run dev:cert
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const certDir = path.join(rootDir, 'certs');

const CA_KEY = path.join(certDir, 'ca-key.pem');
const CA_CERT = path.join(certDir, 'ca.pem');
const SERVER_KEY = path.join(certDir, 'server-key.pem');
const SERVER_CSR = path.join(certDir, 'server.csr');
const SERVER_CERT = path.join(certDir, 'server-cert.pem');
const EXT_FILE = path.join(certDir, 'server-ext.cnf');

// iOS rejects certificates valid for longer than 825 days.
const DAYS = 825;

const OPENSSL_CANDIDATES = [
  'openssl',
  'C:/Program Files/Git/mingw64/bin/openssl.exe',
  'C:/Program Files/Git/usr/bin/openssl.exe',
  'D:/Program Files/Git/mingw64/bin/openssl.exe',
  'D:/Program Files/Git/usr/bin/openssl.exe',
  'C:/ProgramData/chocolatey/bin/openssl.exe'
];

function findOpenSsl() {
  for (const candidate of OPENSSL_CANDIDATES) {
    try {
      execFileSync(candidate, ['version'], { stdio: 'ignore' });
      return candidate;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

function getLanAddress() {
  const all = Object.values(networkInterfaces()).flat();
  const preferred = all.find((net) => {
    if (!net || net.family !== 'IPv4' || net.internal) return false;
    return net.address.startsWith('192.168.') || net.address.startsWith('10.');
  });
  if (preferred) return preferred.address;

  const fallback = all.find((net) => {
    if (!net || net.family !== 'IPv4' || net.internal) return false;
    const [a, b] = net.address.split('.').map(Number);
    return net.address.startsWith('172.') && a === 172 && b >= 16 && b <= 31;
  });
  return fallback ? fallback.address : null;
}

const lanAddress = getLanAddress();
if (!lanAddress) {
  console.error('[dev:cert] 找不到局域网 IPv4 地址，请确认已连接 WiFi。');
  process.exit(1);
}

const openssl = findOpenSsl();
if (!openssl) {
  console.error('[dev:cert] 找不到 openssl。请安装 Git for Windows 或 Win32 OpenSSL 后重试。');
  process.exit(1);
}

mkdirSync(certDir, { recursive: true });
for (const stale of [SERVER_CSR, EXT_FILE]) {
  if (existsSync(stale)) rmSync(stale);
}

if (!existsSync(CA_CERT) || !existsSync(CA_KEY)) {
  console.log('[dev:cert] 生成本地 CA...');
  execFileSync(
    openssl,
    [
      'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
      '-keyout', CA_KEY, '-out', CA_CERT,
      '-days', String(DAYS), '-sha256',
      '-subj', '/CN=Desio ScanGo Dev CA/O=Desio ScanGo Dev',
      '-addext', 'basicConstraints=critical,CA:TRUE,pathlen:0',
      '-addext', 'keyUsage=critical,keyCertSign,cRLSign'
    ],
    { stdio: 'pipe' }
  );
} else {
  console.log('[dev:cert] 复用已有 CA。');
}

writeFileSync(
  EXT_FILE,
  [
    'basicConstraints=CA:FALSE',
    'keyUsage=critical,digitalSignature,keyEncipherment',
    'extendedKeyUsage=serverAuth',
    `subjectAltName=DNS:localhost,DNS:*.local,IP:127.0.0.1,IP:${lanAddress}`,
    ''
  ].join('\n'),
  'utf8'
);

console.log(`[dev:cert] 为 ${lanAddress} 签发服务器证书...`);
execFileSync(
  openssl,
  [
    'req', '-newkey', 'rsa:2048', '-nodes',
    '-keyout', SERVER_KEY, '-out', SERVER_CSR,
    '-subj', `/CN=${lanAddress}/O=Desio ScanGo Dev`
  ],
  { stdio: 'pipe' }
);
execFileSync(
  openssl,
  [
    'x509', '-req', '-in', SERVER_CSR,
    '-CA', CA_CERT, '-CAkey', CA_KEY, '-CAcreateserial',
    '-out', SERVER_CERT, '-days', String(DAYS), '-sha256',
    '-extfile', EXT_FILE
  ],
  { stdio: 'pipe' }
);

rmSync(SERVER_CSR, { force: true });
rmSync(EXT_FILE, { force: true });

console.log('');
console.log('证书已生成:');
console.log(`  服务器证书  ${path.relative(rootDir, SERVER_CERT)}`);
console.log(`  服务器私钥  ${path.relative(rootDir, SERVER_KEY)}`);
console.log(`  根证书      ${path.relative(rootDir, CA_CERT)}  <- 把这个装到 iPhone`);
console.log('');
console.log('iPhone 安装步骤:');
console.log('  1. 先启动 npm run dev，用 Safari 打开 https://<本机IP>:<桌面端显示的端口>/ca.pem');
console.log('     （端口每次启动随机，以桌面端二维码旁显示的为准）');
console.log('  2. 提示无法验证服务器身份时，选「详细信息」>「访问此网站」，按提示安装描述文件');
console.log('  3. 设置 > 通用 > VPN与设备管理 > 安装 "Desio ScanGo Dev CA"');
console.log('  4. 设置 > 通用 > 关于本机 > 证书信任设置 > 打开对该根证书的完整信任');
console.log('');
console.log(`  当前局域网地址: ${lanAddress}`);
console.log('  之后用手机扫桌面端窗口里的二维码即可开始扫码。');
