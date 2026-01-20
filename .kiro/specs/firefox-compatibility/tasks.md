# Implementation Plan: Firefox Compatibility

## Overview

本实现计划将 Aria2-Explorer Chrome 扩展适配为同时支持 Firefox 浏览器。采用渐进式实现策略，首先建立浏览器抽象层，然后逐步适配各个功能模块，最后配置构建系统。

## Tasks

- [ ] 1. 设置浏览器兼容性基础设施
  - [x] 1.1 添加 webextension-polyfill 依赖
    - 下载 `browser-polyfill.min.js` 到 `js/` 目录
    - 该库提供统一的 Promise-based API
    - _Requirements: 2.1_
  
  - [x] 1.2 创建 BrowserCompat 模块
    - 创建 `js/browserCompat.js` 文件
    - 实现浏览器检测逻辑 (`isFirefox`, `isChrome`)
    - 实现 `hasAPI()` 方法检测 API 可用性
    - 实现 `supportsSidePanel`, `supportsPowerAPI`, `supportsSystemDisplay` 属性
    - 实现 `getScreenSize()` 跨浏览器方法
    - 实现 `requestKeepAwake()`, `releaseKeepAwake()` 跨浏览器方法
    - 实现 `getPlatform()` 跨浏览器方法
    - _Requirements: 2.1, 2.4, 10.1, 11.1, 11.2, 12.1, 12.2_
  
  - [ ]* 1.3 编写 BrowserCompat 属性测试
    - **Property 2: API 可用性检测正确性**
    - **Validates: Requirements 2.1, 2.4, 10.1, 11.1, 12.1**

- [ ] 2. 适配下载捕获功能
  - [x] 2.1 创建 DownloadCapture 模块
    - 创建 `js/downloadCapture.js` 文件
    - 实现 `startCapture()` 方法，根据浏览器选择正确的事件监听器
    - 实现 `stopCapture()` 方法
    - 实现 Chrome 的 `onDeterminingFilename` 处理
    - 实现 Firefox 的 `onCreated` 回退处理
    - _Requirements: 3.2, 3.4_
  
  - [x] 2.2 修改 background.js 使用 DownloadCapture
    - 导入 DownloadCapture 模块
    - 替换直接的 `downloads.onDeterminingFilename` 调用
    - 更新 `enableCapture()` 和 `disableCapture()` 函数
    - 更新 `isDownloadListened()` 函数
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 2.3 编写 DownloadCapture 属性测试
    - **Property 3: 下载捕获回退机制正确性**
    - **Validates: Requirements 3.2, 3.4**

- [x] 3. Checkpoint - 确保下载捕获测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [ ] 4. 适配 Side Panel 功能
  - [x] 4.1 创建 SidePanelCompat 模块
    - 创建 `js/sidePanelCompat.js` 文件
    - 实现 `open()` 方法，Firefox 降级为新标签页
    - 实现 `setOptions()`, `getOptions()`, `setPanelBehavior()` 方法
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 4.2 修改 background.js 使用 SidePanelCompat
    - 导入 SidePanelCompat 模块
    - 替换 `launchUI()` 中的 `chrome.sidePanel` 调用
    - 替换 `resetSidePanel()` 中的调用
    - 替换 `init()` 中的 `chrome.sidePanel.setPanelBehavior` 调用
    - _Requirements: 10.2, 10.3_
  
  - [ ]* 4.3 编写 SidePanelCompat 属性测试
    - **Property 4: 功能降级行为正确性**
    - **Validates: Requirements 10.2, 11.2, 12.2**

- [ ] 5. 适配电源和显示 API
  - [x] 5.1 修改 background.js 使用 BrowserCompat 电源方法
    - 替换 `chrome.power.requestKeepAwake` 调用为 `BrowserCompat.requestKeepAwake`
    - 替换 `chrome.power.releaseKeepAwake` 调用为 `BrowserCompat.releaseKeepAwake`
    - _Requirements: 11.1, 11.2_
  
  - [x] 5.2 修改 background.js 使用 BrowserCompat 屏幕尺寸方法
    - 修改 `openInWindow()` 函数使用 `BrowserCompat.getScreenSize()`
    - _Requirements: 12.1, 12.2_
  
  - [x] 5.3 修改 utils.js 的 getPlatform 方法
    - 更新 `Utils.getPlatform()` 使用 `BrowserCompat.getPlatform()`
    - _Requirements: 2.4_

- [ ] 6. 适配选项页面
  - [x] 6.1 修改 options.html 添加 polyfill
    - 在 options.html 中添加 browser-polyfill.min.js 引用
    - _Requirements: 2.1_
  
  - [x] 6.2 修改 options.js 处理 Firefox 特定选项
    - 检测 Side Panel 支持，禁用不支持的选项
    - 检测 Power API 支持，禁用 keepAwake 选项
    - 添加 Firefox 不支持功能的提示信息
    - _Requirements: 10.3, 11.1_

- [x] 7. Checkpoint - 确保功能适配测试通过
  - 确保所有测试通过，如有问题请询问用户。

- [ ] 8. 创建 Manifest 生成系统
  - [x] 8.1 创建 manifest 模板和生成脚本
    - 创建 `build/manifest-generator.js` 文件
    - 实现 `generateChromeManifest()` 函数
    - 实现 `generateFirefoxManifest()` 函数
    - 实现命令行接口支持 `--chrome` 和 `--firefox` 参数
    - _Requirements: 14.1, 14.3_
  
  - [x] 8.2 创建 Firefox 特定的 manifest 配置
    - 添加 `browser_specific_settings` 字段
    - 使用 `background.scripts` 替代 `service_worker`
    - 移除 Firefox 不支持的权限 (sidePanel, system.display, power)
    - 移除 `externally_connectable` 字段
    - 调整 `incognito` 为 `spanning`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 8.3 编写 Manifest 生成属性测试
    - **Property 1: Manifest 生成正确性**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**

- [ ] 9. 配置构建系统
  - [x] 9.1 创建构建脚本
    - 创建 `build/build.js` 主构建脚本
    - 实现 Chrome 版本构建流程
    - 实现 Firefox 版本构建流程
    - 实现打包为 zip 文件功能
    - _Requirements: 14.1, 14.2_
  
  - [x] 9.2 更新 package.json
    - 添加构建脚本命令 (`build:chrome`, `build:firefox`, `build:all`)
    - 添加开发依赖 (如需要)
    - _Requirements: 14.1_
  
  - [ ]* 9.3 编写构建系统属性测试
    - **Property 6: 构建系统双版本生成**
    - **Validates: Requirements 14.1**

- [ ] 10. 适配通知功能
  - [x] 10.1 修改 Utils.showNotification 处理按钮兼容性
    - 检测 Firefox 对通知按钮的支持
    - 在不支持时移除 buttons 字段
    - _Requirements: 6.2_
  
  - [ ]* 10.2 编写通知适配属性测试
    - **Property 7: 通知按钮适配**
    - **Validates: Requirements 6.2**

- [ ] 11. 适配内容脚本注册
  - [x] 11.1 修改 initClickChecker 函数
    - 使用 BrowserCompat 检测 `scripting.registerContentScripts` 支持
    - 为 Firefox 提供替代方案（manifest 中声明 content_scripts）
    - _Requirements: 8.1, 8.2_
  
  - [-] 11.2 更新 Firefox manifest 添加 content_scripts
    - 在 Firefox manifest 中静态声明 clickChecker 内容脚本
    - _Requirements: 8.1, 8.2_
  
  - [ ]* 11.3 编写内容脚本注册属性测试
    - **Property 8: 内容脚本注册检测**
    - **Validates: Requirements 8.2**

- [ ] 12. 存储 API 兼容性验证
  - [ ]* 12.1 编写存储往返属性测试
    - **Property 5: 存储往返一致性**
    - **Validates: Requirements 5.1, 5.2**

- [ ] 13. Final Checkpoint - 确保所有测试通过
  - 运行完整测试套件
  - 验证 Chrome 版本构建和功能
  - 验证 Firefox 版本构建和功能
  - 确保所有测试通过，如有问题请询问用户。

## Notes

- 标记为 `*` 的任务是可选的测试任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求以确保可追溯性
- 检查点任务用于确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证具体示例和边界情况
