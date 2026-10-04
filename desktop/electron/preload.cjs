const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('scango', {
  getServerState: () => ipcRenderer.invoke('server:get-state'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  onServerState: (callback) => {
    ipcRenderer.on('server:state', (_event, state) => callback(state));
  },
  onScanReceived: (callback) => {
    ipcRenderer.on('scan:received', (_event, scan) => callback(scan));
  },
  onInputResult: (callback) => {
    ipcRenderer.on('input:result', (_event, result) => callback(result));
  }
});
