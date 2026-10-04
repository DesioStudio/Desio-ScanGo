import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, CheckCircle2, Keyboard, Languages, MonitorUp, QrCode, Smartphone, Wifi } from 'lucide-react';
import './styles.css';

const fallbackState = {
  running: false,
  host: '0.0.0.0',
  port: 0,
  mobileUrl: '',
  devices: [],
  history: [],
  qrDataUrl: null
};

const translations = {
  zh: {
    subtitle: '手机无线扫码工具',
    running: '运行中',
    stopped: '已停止',
    heroTitle: '把手机变成无线扫码枪。',
    heroText: '扫描配对二维码，用手机摄像头对准条码，Desio ScanGo 会把结果发送到这台 Windows 电脑的当前输入框。',
    starting: '正在启动局域网服务...',
    qrLabel: '手机扫描此二维码打开',
    qrAlt: '手机扫码配对二维码',
    devicesTitle: '已连接设备',
    waitingPhone: '等待手机连接',
    connectedCount: (count) => `已连接 ${count} 台设备`,
    connectedAt: (time) => `连接于 ${time}`,
    noPhone: '还没有手机连接。',
    keyboardTitle: '键盘输入',
    ready: '就绪',
    received: (value) => `已接收 ${value}`,
    typed: '已输入到当前窗口',
    typeIntoActive: '将扫码结果输入到当前窗口',
    pressEnter: '每次扫码后按 Enter',
    activityTitle: '扫码记录',
    latest: (value) => `最新：${value}`,
    waitingFirstScan: '等待第一次扫码',
    keepFocused: '保持目标应用处于焦点，然后用手机扫码。',
    language: '语言',
    langToggle: '英文'
  },
  en: {
    subtitle: 'Wireless phone scanner',
    running: 'Running',
    stopped: 'Stopped',
    heroTitle: 'Use your phone as a wireless barcode scanner.',
    heroText: 'Scan the pairing code, point your phone camera at a barcode, and Desio ScanGo sends the value to the active input field on this Windows computer.',
    starting: 'Starting LAN server...',
    qrLabel: 'Open this on your phone',
    qrAlt: 'Mobile scanner pairing QR code',
    devicesTitle: 'Connected Devices',
    waitingPhone: 'Waiting for phone',
    connectedCount: (count) => `${count} connected`,
    connectedAt: (time) => `Connected ${time}`,
    noPhone: 'No phone connected yet.',
    keyboardTitle: 'Keyboard Input',
    ready: 'Ready',
    received: (value) => `Received ${value}`,
    typed: 'Typed into active window',
    typeIntoActive: 'Type scans into the active window',
    pressEnter: 'Press Enter after each scan',
    activityTitle: 'Scan Activity',
    latest: (value) => `Latest: ${value}`,
    waitingFirstScan: 'Waiting for first scan',
    keepFocused: 'Keep the target app focused, then scan from your phone.',
    language: 'Language',
    langToggle: '中文'
  }
};

function getInitialLanguage() {
  const saved = window.localStorage.getItem('desio-scango-language');
  if (saved === 'zh' || saved === 'en') return saved;
  return 'zh';
}

function formatTime(value, language) {
  return new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(new Date(value));
}

function App() {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [serverState, setServerState] = useState(fallbackState);
  const [settings, setSettings] = useState({ inputEnabled: true, appendEnter: true });
  const [inputStatus, setInputStatus] = useState({ key: 'ready' });
  const t = translations[language];

  useEffect(() => {
    window.scango.getServerState().then(setServerState);
    window.scango.onServerState(setServerState);
    window.scango.onScanReceived((scan) => {
      setInputStatus({ key: 'received', value: scan.value });
    });
    window.scango.onInputResult((result) => {
      setInputStatus(result.ok ? { key: 'typed' } : { key: 'error', value: result.message });
    });
  }, []);

  const latestScan = serverState.history[0];
  const connectedDeviceLabel = useMemo(() => {
    if (!serverState.devices.length) return t.waitingPhone;
    return t.connectedCount(serverState.devices.length);
  }, [serverState.devices.length, t]);

  const inputStatusLabel = useMemo(() => {
    if (inputStatus.key === 'received') return t.received(inputStatus.value);
    if (inputStatus.key === 'typed') return t.typed;
    if (inputStatus.key === 'error') return inputStatus.value;
    return t.ready;
  }, [inputStatus, t]);

  function toggleLanguage() {
    const next = language === 'zh' ? 'en' : 'zh';
    setLanguage(next);
    window.localStorage.setItem('desio-scango-language', next);
  }

  async function updateSetting(key, value) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await window.scango.updateSettings(next);
  }

  return (
    <main className="shell">
      <section className="topbar" aria-label="Application status">
        <div className="brand">
          <div className="mark"><QrCode size={22} /></div>
          <div>
            <h1>Desio ScanGo</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
        <div className="topActions">
          <button className="languageButton" type="button" onClick={toggleLanguage} aria-label={t.language}>
            <Languages size={16} />
            {t.langToggle}
          </button>
          <div className={serverState.running ? 'status running' : 'status'}>
            <span />
            {serverState.running ? t.running : t.stopped}
          </div>
        </div>
      </section>

      <section className="hero">
        <div className="intro">
          <h2>{t.heroTitle}</h2>
          <p>{t.heroText}</p>
          <div className="urlBox">
            <Wifi size={18} />
            <span>{serverState.mobileUrl || t.starting}</span>
          </div>
        </div>
        <div className="qrPanel" aria-label="Phone pairing QR code">
          {serverState.qrDataUrl ? <img src={serverState.qrDataUrl} alt={t.qrAlt} /> : <div className="qrSkeleton" />}
          <p>{t.qrLabel}</p>
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <header>
            <div className="panelIcon"><Smartphone size={18} /></div>
            <div>
              <h3>{t.devicesTitle}</h3>
              <p>{connectedDeviceLabel}</p>
            </div>
          </header>
          <div className="deviceList">
            {serverState.devices.length ? serverState.devices.map((device) => (
              <div className="deviceRow" key={device.id}>
                <Smartphone size={18} />
                <div>
                  <strong>{device.name}</strong>
                  <span>{t.connectedAt(formatTime(device.connectedAt, language))}</span>
                </div>
              </div>
            )) : (
              <div className="empty">{t.noPhone}</div>
            )}
          </div>
        </article>

        <article className="panel">
          <header>
            <div className="panelIcon"><Keyboard size={18} /></div>
            <div>
              <h3>{t.keyboardTitle}</h3>
              <p>{inputStatusLabel}</p>
            </div>
          </header>
          <label className="toggle">
            <input type="checkbox" checked={settings.inputEnabled} onChange={(event) => updateSetting('inputEnabled', event.target.checked)} />
            <span>{t.typeIntoActive}</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={settings.appendEnter} onChange={(event) => updateSetting('appendEnter', event.target.checked)} />
            <span>{t.pressEnter}</span>
          </label>
        </article>
      </section>

      <section className="activity">
        <div className="activityHeader">
          <div>
            <h3>{t.activityTitle}</h3>
            <p>{latestScan ? t.latest(latestScan.value) : t.waitingFirstScan}</p>
          </div>
          <Activity size={20} />
        </div>
        <div className="scanList">
          {serverState.history.length ? serverState.history.map((scan) => (
            <div className="scanRow" key={scan.id}>
              <CheckCircle2 size={18} />
              <strong>{scan.value}</strong>
              <span>{scan.format}</span>
              <time>{formatTime(scan.time, language)}</time>
            </div>
          )) : (
            <div className="empty large">
              <MonitorUp size={24} />
              {t.keepFocused}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
