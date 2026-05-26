const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, nativeImage, screen, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

// ─── 配置持久化 ───────────────────────────────────────────────
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    }
  } catch (e) {}
  return {
    apiKey: '123456789',
    apiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    apiModel: 'glm-4-flash',
    visionModel: 'glm-4v-flash',
    sourceLang: 'auto',
    targetLang: 'zh',
    shortcut: 'Ctrl+Shift+S',
    theme: 'system'
  };
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

let config = loadConfig();

// ─── 窗口与托盘引用 ───────────────────────────────────────────
let mainWindow = null;
let screenshotWindow = null;
let resultWindow = null;
let tray = null;

// ─── 主窗口 ───────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 650,
    minWidth: 750,
    minHeight: 500,
    title: 'AI 翻译助手',
    backgroundColor: '#0f0f0f',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false,
    icon: getIconPath()
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  return mainWindow;
}

// ─── 截图选区窗口 ─────────────────────────────────────────────
function createScreenshotWindow() {
  const displays = screen.getAllDisplays();
  let totalBounds = { x: 0, y: 0, width: 0, height: 0 };
  displays.forEach(d => {
    totalBounds.x = Math.min(totalBounds.x, d.bounds.x);
    totalBounds.y = Math.min(totalBounds.y, d.bounds.y);
    totalBounds.width = Math.max(totalBounds.width, d.bounds.x + d.bounds.width);
    totalBounds.height = Math.max(totalBounds.height, d.bounds.y + d.bounds.height);
  });

  const win = new BrowserWindow({
    x: totalBounds.x,
    y: totalBounds.y,
    width: totalBounds.width,
    height: totalBounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    enableLargerThanScreen: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  win.loadFile(path.join(__dirname, '../renderer/screenshot.html'));
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
    win.webContents.send('screenshot-window-ready', {
      displays: displays.map(d => d.bounds)
    });
  });

  win.on('closed', () => {
    if (screenshotWindow === win) screenshotWindow = null;
  });

  screenshotWindow = win;
}

// ─── 翻译结果浮窗 ─────────────────────────────────────────────
function createResultWindow(x, y, width) {
  if (resultWindow) {
    resultWindow.close();
    resultWindow = null;
  }

  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const winW = Math.min(Math.max(width || 450, 350), 600);
  const winH = 300;
  let winX = Math.min(x || 100, sw - winW - 20);
  let winY = Math.min(y || 100, sh - winH - 20);

  const win = new BrowserWindow({
    x: winX,
    y: winY,
    width: winW,
    height: winH,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  win.loadFile(path.join(__dirname, '../renderer/result.html'));
  win.setAlwaysOnTop(true, 'floating');

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    if (resultWindow === win) resultWindow = null;
  });

  resultWindow = win;
  return win;
}

// ─── 系统托盘 ─────────────────────────────────────────────────
function createTray() {
  const iconPath = getIconPath();
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) icon = nativeImage.createEmpty();
  } catch(e) {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('AI 翻译助手');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主界面',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: '截图翻译 (' + config.shortcut + ')',
      click: () => triggerScreenshot()
    },
    { type: 'separator' },
    {
      label: '设置',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
          mainWindow.webContents.send('open-settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── 快捷键注册 ───────────────────────────────────────────────
function registerShortcuts() {
  globalShortcut.unregisterAll();
  const shortcut = config.shortcut || 'Ctrl+Shift+S';
  const ok = globalShortcut.register(shortcut, () => {
    triggerScreenshot();
  });
  if (!ok) {
    console.error('快捷键注册失败:', shortcut);
  }
}

function triggerScreenshot() {
  if (screenshotWindow) {
    screenshotWindow.close();
    screenshotWindow = null;
    return;
  }
  createScreenshotWindow();
}

// ─── 工具函数 ─────────────────────────────────────────────────
function getIconPath() {
  const ico = path.join(__dirname, '../assets/icon.ico');
  const png = path.join(__dirname, '../assets/icon.png');
  if (fs.existsSync(ico)) return ico;
  if (fs.existsSync(png)) return png;
  return '';
}

// ─── IPC 处理 ─────────────────────────────────────────────────
ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  }
});
ipcMain.on('window-close', () => { if (mainWindow) mainWindow.hide(); });

ipcMain.handle('get-config', () => config);
ipcMain.handle('save-config', (e, newConfig) => {
  config = { ...config, ...newConfig };
  saveConfig(config);
  registerShortcuts();
  updateTrayMenu();
  return { success: true };
});

ipcMain.on('screenshot-selected', async (e, rect) => {
  if (screenshotWindow) {
    screenshotWindow.hide();
  }
  try {
    await new Promise(r => setTimeout(r, 150));
    const sources = await require('electron').desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: rect.screenWidth || screen.getPrimaryDisplay().bounds.width,
        height: rect.screenHeight || screen.getPrimaryDisplay().bounds.height
      }
    });
    if (sources.length === 0) throw new Error('无法获取屏幕截图');
    const src = sources[0];
    const fullImg = src.thumbnail;
    const cropped = fullImg.crop({
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    });
    const base64 = cropped.toDataURL();
    // 截图复制到剪贴板
    if (config.copyToClipboard) {
      try {
        const nativeImg = nativeImage.createFromDataURL(base64);
        clipboard.writeImage(nativeImg);
      } catch (clipErr) {
        console.error('复制截图到剪贴板失败:', clipErr);
      }
    }
    if (screenshotWindow) {
      screenshotWindow.close();
      screenshotWindow = null;
    }
    const rw = createResultWindow(rect.screenX || 100, rect.screenY || 100, rect.width);
    rw.webContents.once('did-finish-load', () => {
      rw.webContents.send('translate-image', { imageData: base64, config });
    });
  } catch (err) {
    console.error('截图失败:', err);
    if (screenshotWindow) {
      screenshotWindow.close();
      screenshotWindow = null;
    }
    if (mainWindow) {
      mainWindow.show();
      mainWindow.webContents.send('screenshot-error', err.message);
    }
  }
});

ipcMain.on('screenshot-cancelled', () => {
  if (screenshotWindow) {
    screenshotWindow.close();
    screenshotWindow = null;
  }
});

ipcMain.handle('translate-text', async (e, { text, sourceLang, targetLang }) => {
  return await performTranslation(text, sourceLang || config.sourceLang, targetLang || config.targetLang);
});

ipcMain.on('close-result', () => {
  if (resultWindow) resultWindow.close();
});

ipcMain.on('copy-text', (e, text) => {
  clipboard.writeText(text);
});

ipcMain.on('copy-image', (e, dataUrl) => {
  const nativeImg = nativeImage.createFromDataURL(dataUrl);
  clipboard.writeImage(nativeImg);
});

// ─── 翻译核心逻辑 ─────────────────────────────────────────────
// 判断是否为单个单词（简单启发式判断）
function isSingleWord(text) {
  const trimmed = text.trim();
  // 去除常见标点后，检查是否只有一个词
  const words = trimmed.split(/[\s,，.。!?！？\n]+/).filter(w => w.length > 0);
  if (words.length === 1) {
    // 检查是否主要是字母/日文假名/韩文组成
    const word = words[0];
    // 英文单词（纯字母）
    if (/^[a-zA-Z]+$/.test(word)) return { type: 'en', word: word };
    // 日文假名
    if (/^[\u3040-\u309F\u30A0-\u30FF]+$/.test(word)) return { type: 'ja', word: word };
    // 韩文
    if (/^[\uAC00-\uD7AF]+$/.test(word)) return { type: 'ko', word: word };
  }
  return null;
}

async function performTranslation(text, sourceLang, targetLang) {
  const cfg = config;
  const langMap = {
    'zh': '中文', 'en': '英文', 'ja': '日文', 'ko': '韩文',
    'fr': '法文', 'de': '德文', 'es': '西班牙文', 'ru': '俄文',
    'ar': '阿拉伯文', 'pt': '葡萄牙文', 'it': '意大利文',
    'auto': '自动检测'
  };
  const srcName = langMap[sourceLang] || sourceLang;
  const tgtName = langMap[targetLang] || targetLang;

  // 检测是否为单词
  const wordInfo = isSingleWord(text);
  let systemPrompt;

  let systemRoleContent, userContent;

  if (wordInfo) {
    // 单词查词典模式
    if (wordInfo.type === 'en') {
      systemRoleContent = `你是一个专业英语词典工具。用户输入单词后，你必须严格按照以下固定格式输出，不得省略任何字段：

【单词】单词原文
【音标】/美式IPA音标/（必须标注重音符号）
【词性】n./v./adj./adv. 等
【英文释义】1. 英文释义一 2. 英文释义二
【中文释义】1. 中文释义一 2. 中文释义二
【例句】英文例句 + 中文翻译

注意：音标必须使用美式发音IPA，如 hello 应为 /həˈloʊ/。输出必须完整包含以上所有标签行。`;
      userContent = wordInfo.word;
    } else if (wordInfo.type === 'ja') {
      systemRoleContent = `你是一个专业日语词典工具。用户输入单词后，你必须严格按照以下固定格式输出，不得省略任何字段：

【单词】单词原文
【读音】假名读音（含振假名）
【词性】名词/动词/形容词等
【中文释义】中文解释
【日文释义】日语解释
【例句】日文例句 + 中文翻译

输出必须完整包含以上所有标签行。`;
      userContent = wordInfo.word;
    } else if (wordInfo.type === 'ko') {
      systemRoleContent = `你是一个专业韩语词典工具。用户输入单词后，你必须严格按照以下固定格式输出，不得省略任何字段：

【单词】单词原文
【读音】罗马音标注
【词性】名词/动词/形容词等
【中文释义】中文解释
【韩文释义】韩文解释
【例句】韩文例句 + 中文翻译

输出必须完整包含以上所有标签行。`;
      userContent = wordInfo.word;
    }
  } else {
    // 普通翻译模式
    if (sourceLang === 'auto') {
      systemRoleContent = `你是一位专业翻译，擅长${tgtName}翻译。规则：
1. 翻译成${tgtName}，输出只包含译文
2. 英文专有名词首次出现时在括号内标注美式音标，如：纽约 (/nuːˈjɔrk/)
3. 不要解释、不要重复原文、不要添加格式标记`;
    } else {
      systemRoleContent = `你是一位专业翻译，擅长${srcName}到${tgtName}翻译。规则：
1. 将${srcName}翻译成${tgtName}，输出只包含译文
2. 专有名词首次出现时在括号内标注音标
3. 不要解释、不要重复原文、不要添加格式标记`;
    }
    userContent = text;
  }

  try {
    const axios = require('axios');
    // 智谱API用system role正常，其他API也兼容
    const messages = [
      { role: 'system', content: systemRoleContent },
      { role: 'user', content: userContent }
    ];
    const response = await axios.post(
      cfg.apiUrl || 'https://api.openai.com/v1/chat/completions',
      {
        model: cfg.apiModel || 'gpt-3.5-turbo',
        messages: messages
      },
      {
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    const result = response.data.choices[0].message.content.trim();
    return { success: true, result };
  } catch (err) {
    console.error('翻译API错误:', err.response?.data || err.message);
    const errMsg = err.response?.data?.error?.message || err.response?.data?.message || err.message || '翻译失败';
    return { success: false, error: errMsg };
  }
}

// ─── 更新托盘菜单 ─────────────────────────────────────────────
function updateTrayMenu() {
  if (!tray) return;
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示主界面', click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { label: `截图翻译 (${config.shortcut})`, click: () => triggerScreenshot() },
    { type: 'separator' },
    {
      label: '设置',
      click: () => { mainWindow?.show(); mainWindow?.focus(); mainWindow?.webContents.send('open-settings'); }
    },
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuiting = true; app.quit(); } }
  ]);
  tray.setContextMenu(contextMenu);
}

// ─── App 生命周期 ─────────────────────────────────────────────
app.whenReady().then(() => {
  createMainWindow();
  createTray();
  registerShortcuts();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    else mainWindow?.show();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {});
