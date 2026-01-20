# Firefox 兼容性实现说明

本文档描述了 Aria2-Explorer 扩展如何实现 Chrome 和 Firefox 双浏览器兼容。

## 架构概述

采用**单一代码库 + 构建时分离**策略：
- 核心代码在两个浏览器中共享
- 仅 `manifest.json` 在构建时生成浏览器特定版本
- 通过浏览器抽象层处理 API 差异

```
源代码 → 构建脚本 → Chrome 扩展包
                  → Firefox 扩展包
```

## 核心模块

### 1. BrowserCompat (`js/browserCompat.js`)

浏览器兼容性检测和 API 适配层：

```javascript
// 浏览器检测
BrowserCompat.isFirefox  // true/false
BrowserCompat.isChrome   // true/false

// API 可用性检测
BrowserCompat.supportsSidePanel
BrowserCompat.supportsPowerAPI
BrowserCompat.supportsSystemDisplay
BrowserCompat.supportsOnDeterminingFilename

// 跨浏览器方法
BrowserCompat.getScreenSize()      // 获取屏幕尺寸
BrowserCompat.requestKeepAwake()   // 电源管理
BrowserCompat.getPlatform()        // 获取平台信息
```

### 2. DownloadCapture (`js/downloadCapture.js`)

下载捕获适配器，处理 `downloads.onDeterminingFilename` 的兼容性：

- **Chrome**: 使用 `onDeterminingFilename` 事件，可在下载开始前拦截
- **Firefox**: 使用 `onCreated` 事件作为回退，下载开始后拦截

```javascript
const capture = new DownloadCapture();
capture.startCapture(callback);  // 自动选择正确的事件
capture.stopCapture();
```

### 3. SidePanelCompat (`js/sidePanelCompat.js`)

Side Panel 功能降级：

- **Chrome**: 使用原生 Side Panel API
- **Firefox**: 自动降级为新标签页

## 主要差异处理

| 功能 | Chrome | Firefox | 处理方式 |
|------|--------|---------|----------|
| 后台脚本 | Service Worker | Background Script | manifest 分离 |
| 下载拦截 | `onDeterminingFilename` | `onCreated` | DownloadCapture 适配 |
| Side Panel | 原生支持 | 不支持 | 降级为标签页 |
| Power API | 支持 | 不支持 | 静默忽略 |
| system.display | 支持 | 不支持 | 使用 window.screen |

## Manifest 差异

### Chrome 特有配置
```json
{
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "permissions": ["sidePanel", "system.display", "power", ...],
  "side_panel": { "default_path": "ui/ariang/index.html" }
}
```

### Firefox 特有配置
```json
{
  "browser_specific_settings": {
    "gecko": {
      "id": "nicong@aspect.dev",
      "strict_min_version": "109.0"
    }
  },
  "background": {
    "scripts": ["js/browser-polyfill.min.js", "background.js"],
    "type": "module"
  }
}
```

## 构建命令

```bash
# 构建 Chrome 版本
npm run build:chrome

# 构建 Firefox 版本
npm run build:firefox

# 构建两个版本
npm run build:all
```

输出目录：
- `dist/chrome/` - Chrome 扩展文件
- `dist/firefox/` - Firefox 扩展文件
- `dist/aria2-explorer-chrome.zip` - Chrome 打包文件
- `dist/aria2-explorer-firefox.zip` - Firefox 打包文件

## Firefox 下载拦截的特殊处理

由于 Firefox 的 `onCreated` 事件在下载开始后才触发，存在以下限制：

1. **文件大小未知**: `onCreated` 触发时 `fileSize` 可能为 `-1`
   - 解决方案：延迟 150ms 后重新查询，或对未知大小的文件直接拦截

2. **下载弹窗**: 取消下载后浏览器可能显示"已取消"提示
   - 解决方案：调用 `downloads.erase()` 清除下载记录
   - 用户可在浏览器设置中关闭下载面板自动弹出

## 安装测试

### Chrome
1. 打开 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `dist/chrome/` 目录

### Firefox
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击「临时载入附加组件」
3. 选择 `dist/firefox/manifest.json`

或使用 web-ext 工具：
```bash
npx web-ext run --source-dir dist/firefox
```

## 依赖

- [webextension-polyfill](https://github.com/nicong/webextension-polyfill) - 统一 Promise-based API
