import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import { Camera, CheckCircle2, Languages, Radio, RotateCcw, Volume2, VolumeX, WifiOff } from 'lucide-react';
import './styles.css';

const SCAN_COOLDOWN_MS = 1100;
const SOUND_STORAGE_KEY = 'desio-scango-sound';

const translations = {
  zh: {
    subtitle: '无线扫码器',
    connected: '已连接',
    connecting: '连接中',
    disconnected: '未连接',
    cannotConnect: '无法连接到电脑。请检查 WiFi，并重新扫描桌面端二维码。',
    insecureOrigin: '当前不是安全来源，浏览器已禁用摄像头。请改用 https 访问本页。',
    startScan: '开始扫码',
    scanSuccess: '扫码成功',
    ready: '准备就绪',
    readyText: '将摄像头对准二维码或条码。',
    stop: '停止',
    start: '开始',
    language: '语言',
    langToggle: '英文',
    sound: '提示音',
    soundOn: '提示音已开启',
    soundOff: '提示音已关闭'
  },
  en: {
    subtitle: 'Wireless scanner',
    connected: 'Connected',
    connecting: 'connecting',
    disconnected: 'disconnected',
    cannotConnect: 'Cannot connect to desktop. Check WiFi and reopen the QR code.',
    insecureOrigin: 'Not a secure origin, so the camera is blocked. Open this page over https.',
    startScan: 'Start Scan',
    scanSuccess: 'Scan Success',
    ready: 'Ready',
    readyText: 'Point the camera at a QR code or barcode.',
    stop: 'Stop',
    start: 'Start',
    language: 'Language',
    langToggle: '中文',
    sound: 'Sound',
    soundOn: 'Sound on',
    soundOff: 'Sound off'
  }
};

function getInitialLanguage() {
  const saved = window.localStorage.getItem('desio-scango-language');
  if (saved === 'zh' || saved === 'en') return saved;
  return 'zh';
}

function getInitialSound() {
  return window.localStorage.getItem(SOUND_STORAGE_KEY) !== 'off';
}

let audioContext = null;

// iOS only allows an AudioContext to start inside a user gesture, so it is
// created when the scan button is pressed, not when the page loads.
function primeAudio() {
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioContext) audioContext = new AudioCtor();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function playBeep() {
  const context = primeAudio();
  if (!context) return;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(880, context.currentTime);
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, context.currentTime + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.15);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.16);
}

function getConnectionUrl() {
  const params = new URLSearchParams(window.location.search);
  const host = params.get('host') || window.location.hostname;
  const port = params.get('port') || window.location.port;
  // A page served over https may not open a plain ws:// socket (mixed content).
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${scheme}://${host}${port ? `:${port}` : ''}/ws`;
}

function getDeviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android Phone';
  return 'Phone';
}

function App() {
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const readerRef = useRef(null);
  const lastScanRef = useRef({ value: '', at: 0 });
  const [connection, setConnection] = useState('connecting');
  const [scanner, setScanner] = useState('idle');
  const [lastScan, setLastScan] = useState(null);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState(getInitialLanguage);
  const soundEnabledRef = useRef(getInitialSound());
  const [soundEnabled, setSoundEnabled] = useState(soundEnabledRef.current);

  const wsUrl = useMemo(getConnectionUrl, []);
  const t = translations[language];

  useEffect(() => {
    if (!window.isSecureContext) {
      setError(translations[getInitialLanguage()].insecureOrigin);
    }
  }, []);

  useEffect(() => {
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setConnection('connected');
      socket.send(JSON.stringify({ type: 'device', name: getDeviceName() }));
    });
    socket.addEventListener('close', () => setConnection('disconnected'));
    socket.addEventListener('error', () => {
      setConnection('disconnected');
      setError(translations[getInitialLanguage()].cannotConnect);
    });

    return () => socket.close();
  }, [wsUrl]);

  async function startScanner() {
    setError('');
    setScanner('starting');
    primeAudio();

    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.QR_CODE,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39
      ]);

      const reader = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 180
      });
      readerRef.current = reader;

      await reader.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        },
        videoRef.current,
        (result) => {
          if (!result) return;
          const value = result.getText();
          const now = Date.now();
          if (lastScanRef.current.value === value && now - lastScanRef.current.at < SCAN_COOLDOWN_MS) return;
          lastScanRef.current = { value, at: now };
          const scan = {
            type: 'barcode',
            value,
            format: result.getBarcodeFormat()?.toString?.() || 'unknown',
            time: new Date().toISOString()
          };
          setLastScan(scan);
          socketRef.current?.send(JSON.stringify(scan));
          if ('vibrate' in navigator) navigator.vibrate(60);
          if (soundEnabledRef.current) playBeep();
        }
      );

      setScanner('scanning');
    } catch (err) {
      setScanner('error');
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function stopScanner() {
    readerRef.current?.reset?.();
    setScanner('idle');
  }

  const isConnected = connection === 'connected';
  const isScanning = scanner === 'scanning' || scanner === 'starting';
  const connectionLabel = connection === 'connected' ? t.connected : connection === 'disconnected' ? t.disconnected : t.connecting;

  function toggleSound() {
    const next = !soundEnabledRef.current;
    soundEnabledRef.current = next;
    setSoundEnabled(next);
    window.localStorage.setItem(SOUND_STORAGE_KEY, next ? 'on' : 'off');
    if (next) playBeep();
  }

  function toggleLanguage() {
    const next = language === 'zh' ? 'en' : 'zh';
    setLanguage(next);
    window.localStorage.setItem('desio-scango-language', next);
    const matched = ['cannotConnect', 'insecureOrigin'].find(
      (key) => error === translations.zh[key] || error === translations.en[key]
    );
    if (matched) {
      setError(translations[next][matched]);
    }
  }

  return (
    <main className="phoneShell">
      <section className="phoneHeader">
        <div>
          <h1>Desio ScanGo</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="phoneActions">
          <button
            className="languageButton iconOnly"
            type="button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? t.soundOn : t.soundOff}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>
          <button className="languageButton compact" type="button" onClick={toggleLanguage} aria-label={t.language}>
            <Languages size={15} />
            {t.langToggle}
          </button>
          <div className={isConnected ? 'connection ok' : 'connection'}>
            {isConnected ? <Radio size={16} /> : <WifiOff size={16} />}
            <span>{connectionLabel}</span>
          </div>
        </div>
      </section>

      <section className="scannerSurface">
        <video ref={videoRef} muted playsInline />
        <div className="scanFrame" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        {!isScanning && (
          <button className="startButton" onClick={startScanner} disabled={!isConnected}>
            <Camera size={22} />
            {t.startScan}
          </button>
        )}
      </section>

      <section className="resultPanel" aria-live="polite">
        {lastScan ? (
          <>
            <CheckCircle2 size={24} />
            <div>
              <h2>{t.scanSuccess}</h2>
              <p>{lastScan.value}</p>
            </div>
          </>
        ) : (
          <>
            <Camera size={24} />
            <div>
              <h2>{t.ready}</h2>
              <p>{t.readyText}</p>
            </div>
          </>
        )}
      </section>

      {error && <p className="errorText">{error}</p>}

      <section className="controls">
        <button onClick={isScanning ? stopScanner : startScanner} disabled={!isConnected}>
          {isScanning ? <RotateCcw size={18} /> : <Camera size={18} />}
          {isScanning ? t.stop : t.start}
        </button>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
