# 🌈 AI 翻译助手

<p align="center">
  <img src="assets/icon.png" width="120" alt="icon">
</p>

<p align="center">
  <a href="https://github.com"><img src="https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge&logo=windows&logoColor=white"></a>
  <a href="https://electronjs.org"><img src="https://img.shields.io/badge/Electron-35.7.5-9FE870?style=for-the-badge&logo=electron&logoColor=white"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/Node.js-24.x-green?style=for-the-badge&logo=nodedotjs&logoColor=white"></a>
  <a href="https://open.bigmodel.cn"><img src="https://img.shields.io/badge/AI-智谱GLM-ff6b6b?style=for-the-badge&logo=openai&logoColor=white"></a>
  <img src="https://img.shields.io/badge/License-ISC-purple?style=for-the-badge">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/🔥-基于大模型API-red?style=for-the-badge">
  <img src="https://img.shields.io/badge/⚡-截图翻译秒级响应-yellow?style=for-the-badge">
  <img src="https://img.shields.io/badge/🛡️-本地运行数据不出户-lightgrey?style=for-the-badge">
</p>

---

## ✨ 功能亮点

| 🎯 功能 | 📝 描述 | 🚀 状态 |
|:---:|:---|:---:|
| 📝 **文本翻译** | 输入即译，支持多语言互译 | ✅ 已完成 |
| ✂️ **截图翻译** | 全局快捷键截图，OCR自动识别+翻译 | ✅ 已完成 |
| 🤖 **智能识别** | 自动判断是单词/答题/普通文本，用不同 prompt | ✅ 已完成 |
| 📋 **截图自动复制** | 截图后自动写入剪贴板 | ✅ 已完成 |
| 🌐 **多服务商** | 智谱/DeepSeek/通义千问/OpenAI 一键切换 | ✅ 已完成 |
| 🔍 **专业词典** | 英文/日文/韩文单词自动调用专业词典 | ✅ 已完成 |
| 🖥️ **系统托盘** | 最小化到托盘，后台常驻随时唤起 | ✅ 已完成 |
| 🎨 **格式化结果** | 翻译结果按词典/答题/翻译三种模式分别展示 | ✅ 已完成 |

---

## 🛠️ 技术栈

<div align="center">

| 🧩 模块 | 🔧 技术 | 🎨 颜色 |
|:---:|:---:|:---:|
| **框架** | Electron 35.7.5 | 🟢 Green |
| **运行时** | Node.js 24.x | 🟩 Green |
| **HTTP** | axios | 🟦 Blue |
| **大模型** | 智谱 GLM-4-Flash | 🟣 Purple |
| **视觉模型** | 智谱 GLM-4V-Flash | 🔴 Red |
| **打包** | electron-builder | 🟠 Orange |

</div>

---

## 📂 项目结构

```
📦 ai-translator-v2-src/
├── 🟡 src/
│   ├── 🟢 main.js          # 主进程
│   └── 🔵 preload.js       # 预加载脚本
├── 🟣 renderer/
│   ├── 📄 index.html       # 主界面
│   ├── 📄 result.html      # 结果页
│   └── 📄 screenshot.html  # 截图界面
├── 🟠 assets/
│   └── 🖼️ icon.png/ico
├── 📄 package.json
├── 📄 README.md
├── 🚫 .gitignore
└── 🔧 .gitattributes
```

---

## 🚀 快速开始

### 1️⃣ 安装依赖

```bash
npm install
```

### 2️⃣ 开发模式启动

```bash
npm start
```

> ⚠️ **注意**：默认 API Key 为 `123456789`，请在设置页修改为你的真实 Key！

### 3️⃣ 打包发行版

```bash
npm run build
```

📦 打包输出目录：`../release/`

---

## ⚙️ 配置说明

打开应用 → **设置页**，可配置以下项目：

| 🔧 配置项 | 📋 说明 | 🌟 推荐值 |
|:---:|:---|:---:|
| 🌐 API 地址 | 大模型 API 端点 | 预设一键填充 |
| 🔑 API Key | 你的 API 密钥 | 请妥善保管 |
| 📝 文本模型 | 文本翻译模型 | `glm-4-flash` |
| 👁️ 视觉模型 | 截图 OCR 模型 | `glm-4v-flash` |
| 📋 自动复制 | 截图后自动写入剪贴板 | `关闭` / `开启` |

### 🎯 服务商预设

选择服务商后，**自动填充** API 地址 + 文本模型 + 视觉模型：

```
🟣 智谱 GLM      →  glm-4-flash  / glm-4v-flash
🔵 DeepSeek       →  (待配置)
🟠 通义千问       →  (待配置)
⚪ OpenAI         →  (待配置)
```

---

## 📸 截图翻译流程

```
🖱️ 按下全局快捷键
        ↓
✂️ 框选屏幕区域
        ↓
🤖 调用视觉模型 OCR 识别文字
        ↓
🌐 调用翻译模型翻译
        ↓
🖥️ 弹出结果窗口，格式化展示
```

---

## ⚠️ 注意事项

| 🚨 问题 | 💡 说明 |
|:---:|:---|
| 🚫 不能直接双击 exe | 必须通过 `electron.exe .` 或 `start.bat` 启动 |
| 📦 electron.exe 易丢失 | 发布版需确保 electron.exe 与 DLL 完整 |
| 🔑 默认 Key 无效 | 默认 `123456789` 仅为占位，需替换为真实 Key |
| 🚫 勿传 node_modules | 已配置 `.gitignore` 自动忽略 |

---

## 📊 项目统计

<p align="center">
  <img src="https://img.shields.io/github/repo-size/yourusername/ai-translator?style=for-the-badge&color=blue">
  <img src="https://img.shields.io/github/last-commit/yourusername/ai-translator?style=for-the-badge&color=green">
  <img src="https://img.shields.io/github/issues/yourusername/ai-translator?style=for-the-badge&color=red">
  <img src="https://img.shields.io/github/stars/yourusername/ai-translator?style=for-the-badge&color=yellow">
</p>

---

## 👨‍💻 作者

<p align="center">
  <b>🌟 苑泽宇 🌟</b><br>
  <i>四川大学软件工程 · 大二</i><br>
  📧 联系方式：请在 GitHub 留言
</p>

---

## 📜 许可证

```
ISC License
```

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer">
</p>
