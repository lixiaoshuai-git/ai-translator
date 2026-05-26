const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 窗口控制
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // 配置
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (cfg) => ipcRenderer.invoke('save-config', cfg),

  // 翻译
  translateText: (params) => ipcRenderer.invoke('translate-text', params),

  // 截图
  screenshotSelected: (rect) => ipcRenderer.send('screenshot-selected', rect),
  screenshotCancelled: () => ipcRenderer.send('screenshot-cancelled'),

  // 结果窗口
  closeResult: () => ipcRenderer.send('close-result'),
  copyText: (text) => ipcRenderer.send('copy-text', text),
  copyImage: (dataUrl) => ipcRenderer.send('copy-image', dataUrl),

  // 事件监听
  on: (channel, callback) => {
    const allowed = [
      'open-settings', 'screenshot-error', 'screenshot-window-ready',
      'translate-image', 'translation-result'
    ];
    if (allowed.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});
