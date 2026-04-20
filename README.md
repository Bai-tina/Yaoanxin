# 药安心

一个面向医生与患者的 AD 用药安全演示项目：
- 前端：React + TypeScript + Tailwind
- 后端：Node.js + Express（对接 DeepSeek API）

## 环境要求
- Node.js 18+
- npm 9+

## 1. 安装依赖
在项目根目录执行：

```bash
npm install
```

## 2. 启动后端（DeepSeek 接口）
先配置环境变量，再启动后端：

```bash
export DEEPSEEK_API_KEY="你的_deepseek_api_key"
node server/index.js
```

启动后默认监听：`http://localhost:4000`

## 3. 启动前端（开发模式）
新开一个终端，在项目根目录执行：

```bash
npm run dev
```

前端会由 esbuild 本地服务启动，终端会输出访问地址（通常是 `http://127.0.0.1:8000` 一类地址）。

## 4. 生产构建

```bash
npm run build
```

构建产物在 `dist/` 目录，可直接部署静态文件。

## 5. 常见问题
- 前端评估接口报错：确认后端已启动，且 `DEEPSEEK_API_KEY` 已正确设置。
- WSL/Windows 混用时报 esbuild 平台错误：删除 `node_modules` 后在当前系统重新执行 `npm install`。
