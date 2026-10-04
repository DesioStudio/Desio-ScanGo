const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const path = require('node:path');
const { createScanServer } = require('../server/scan-server.cjs');
const { sendKeyboardText } = require('../input/windows-sendkeys.cjs');

let mainWindow;
let scanServer;
let lastSettings = {
  appendEnter: true,
  inputEnabled: true
};

function buildApplicationMenu() {
  const template = [
    {
      label: '文件',
      submenu: [{ label: '退出', role: 'quit' }]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { type: 'separator' },
        { label: '全选', role: 'selectall' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', role: 'reload' },
        { label: '强制刷新', role: 'forcereload' },
        { label: '开发者工具', role: 'toggledevtools' },
        { type: 'separator' },
        { label: '实际大小', role: 'resetzoom' },
        { label: '放大', role: 'zoomin' },
        { label: '缩小', role: 'zoomout' },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { label: '最小化', role: 'minimize' },
        { label: '关闭', role: 'close' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 Desio ScanGo',
          click: () => {
            dialog.showMessageBox({
              title: '关于 Desio ScanGo',
              message: 'Desio ScanGo',
              detail: '把手机变成这台电脑的无线扫码枪。'
            });
          }
        }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1040,
    height: 760,
    minWidth: 880,
    minHeight: 620,
    title: 'Desio ScanGo',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const rendererUrl = process.env.VITE_DEV_SERVER_URL;
  if (rendererUrl) {
    await mainWindow.loadURL(rendererUrl);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

async function startServer() {
  scanServer = await createScanServer({
    mobileDevServerUrl: process.env.MOBILE_DEV_SERVER_URL,
    onStateChange: (state) => sendToRenderer('server:state', state),
    onScan: async (scan) => {
      sendToRenderer('scan:received', scan);
      if (!lastSettings.inputEnabled) return;
      try {
        await sendKeyboardText(scan.value, { appendEnter: lastSettings.appendEnter });
        sendToRenderer('input:result', { ok: true, scanId: scan.id });
      } catch (error) {
        sendToRenderer('input:result', {
          ok: false,
          scanId: scan.id,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });
}

app.whenReady().then(async () => {
  buildApplicationMenu();
  await startServer();

  // Register the handlers before the window exists, otherwise the renderer can
  // call them before they are ready and lose the initial state.
  ipcMain.handle('server:get-state', () => scanServer.getState());
  ipcMain.handle('settings:update', (_event, settings) => {
    lastSettings = { ...lastSettings, ...settings };
    return lastSettings;
  });

  await createWindow();

  // Re-broadcast now that a listener can actually receive it.
  await scanServer.refresh();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  if (scanServer) {
    await scanServer.close();
  }
});
