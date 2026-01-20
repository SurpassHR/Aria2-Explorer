# Requirements Document

## Introduction

本文档定义了将 Aria2-Explorer Chrome 扩展（Manifest V3）适配为同时支持 Firefox 浏览器的需求。该扩展是一个 aria2 下载管理器，需要在保持 Chrome 兼容性的同时，实现对 Firefox 的完整支持。

## Glossary

- **Extension**: 浏览器扩展程序，用于增强浏览器功能
- **Manifest_V3**: Chrome 扩展的第三代配置格式规范
- **Service_Worker**: Chrome MV3 中的后台脚本运行环境
- **Background_Script**: Firefox 中的后台脚本运行环境
- **Browser_API**: 浏览器提供的扩展 API 命名空间（chrome.* 或 browser.*）
- **Side_Panel**: Chrome 特有的侧边栏面板功能
- **Downloads_API**: 浏览器下载管理 API
- **WebExtensions**: Firefox 的扩展 API 标准
- **Polyfill**: 用于填补不同浏览器 API 差异的兼容层代码

## Requirements

### Requirement 1: Manifest 配置兼容

**User Story:** 作为开发者，我希望扩展的 manifest.json 能同时被 Chrome 和 Firefox 识别，以便在两个浏览器中都能正确加载。

#### Acceptance Criteria

1. WHEN 扩展在 Firefox 中加载 THEN Extension SHALL 使用 `browser_specific_settings` 字段声明 Firefox 兼容性
2. WHEN 扩展在 Firefox 中运行 THEN Extension SHALL 使用 `background.scripts` 替代 `service_worker` 配置
3. WHEN manifest 包含 Chrome 特有权限 THEN Extension SHALL 移除或替换 Firefox 不支持的权限（如 `sidePanel`, `system.display`, `power`）
4. IF manifest 包含 `minimum_chrome_version` THEN Extension SHALL 添加对应的 Firefox 最低版本要求
5. WHEN 扩展在 Firefox 中加载 THEN Extension SHALL 正确处理 `externally_connectable` 配置的差异

### Requirement 2: 后台脚本兼容

**User Story:** 作为用户，我希望扩展的后台功能在 Firefox 中正常工作，以便我能使用所有下载管理功能。

#### Acceptance Criteria

1. WHEN 后台脚本在 Firefox 中运行 THEN Background_Script SHALL 使用 `browser.*` API 命名空间或兼容层
2. WHEN 后台脚本需要持久运行 THEN Background_Script SHALL 适配 Firefox 的非 Service Worker 环境
3. WHEN 后台脚本使用 ES 模块导入 THEN Background_Script SHALL 确保 Firefox 支持模块化加载
4. IF Chrome 特有 API 被调用 THEN Background_Script SHALL 提供 Firefox 替代实现或优雅降级

### Requirement 3: 下载捕获功能兼容

**User Story:** 作为用户，我希望在 Firefox 中也能自动捕获下载并发送到 aria2，以便获得与 Chrome 相同的下载体验。

#### Acceptance Criteria

1. WHEN 下载被触发 THEN Downloads_API SHALL 在 Firefox 中正确拦截下载请求
2. WHEN 使用 `downloads.onDeterminingFilename` 事件 THEN Extension SHALL 检测 Firefox 是否支持该事件并提供替代方案
3. WHEN 下载被取消并重定向到 aria2 THEN Extension SHALL 在 Firefox 中正确执行取消和重定向操作
4. IF Firefox 不支持某些下载事件 THEN Extension SHALL 使用 `downloads.onCreated` 作为替代

### Requirement 4: 上下文菜单兼容

**User Story:** 作为用户，我希望右键菜单功能在 Firefox 中正常显示和工作，以便我能快速导出链接到 aria2。

#### Acceptance Criteria

1. WHEN 用户右键点击链接 THEN ContextMenu SHALL 在 Firefox 中显示导出选项
2. WHEN 上下文菜单被创建 THEN ContextMenu SHALL 使用 Firefox 兼容的菜单 API
3. WHEN 菜单项被点击 THEN ContextMenu SHALL 正确触发下载操作

### Requirement 5: 存储 API 兼容

**User Story:** 作为用户，我希望我的配置在 Firefox 中能正确保存和读取，以便我的设置不会丢失。

#### Acceptance Criteria

1. WHEN 配置被保存 THEN Storage_API SHALL 在 Firefox 中正确写入 local storage
2. WHEN 配置被读取 THEN Storage_API SHALL 在 Firefox 中正确读取已保存的配置
3. WHEN 存储变化事件触发 THEN Storage_API SHALL 在 Firefox 中正确监听变化

### Requirement 6: 通知 API 兼容

**User Story:** 作为用户，我希望在 Firefox 中也能收到下载完成等通知，以便我能及时了解下载状态。

#### Acceptance Criteria

1. WHEN 下载完成或出错 THEN Notification_API SHALL 在 Firefox 中显示通知
2. WHEN 通知包含按钮 THEN Extension SHALL 检测 Firefox 对通知按钮的支持并适配
3. WHEN 用户点击通知 THEN Notification_API SHALL 在 Firefox 中正确响应点击事件

### Requirement 7: 标签页和窗口 API 兼容

**User Story:** 作为用户，我希望扩展能在 Firefox 中正确打开和管理标签页，以便我能访问 AriaNG 界面。

#### Acceptance Criteria

1. WHEN 用户点击扩展图标 THEN Tabs_API SHALL 在 Firefox 中正确打开 AriaNG 界面
2. WHEN 需要创建新窗口 THEN Windows_API SHALL 在 Firefox 中正确创建弹出窗口
3. WHEN 查询当前标签页 THEN Tabs_API SHALL 在 Firefox 中返回正确的标签信息

### Requirement 8: 内容脚本注入兼容

**User Story:** 作为用户，我希望扩展的内容脚本在 Firefox 中正常工作，以便点击检测等功能正常运行。

#### Acceptance Criteria

1. WHEN 内容脚本需要注入 THEN Scripting_API SHALL 在 Firefox 中正确注册和执行内容脚本
2. WHEN 使用 `scripting.registerContentScripts` THEN Extension SHALL 检测 Firefox 支持并提供替代方案
3. WHEN 内容脚本与后台通信 THEN Extension SHALL 在 Firefox 中正确传递消息

### Requirement 9: 浏览器动作图标兼容

**User Story:** 作为用户，我希望扩展图标在 Firefox 中正确显示状态，以便我能直观了解扩展状态。

#### Acceptance Criteria

1. WHEN 扩展状态改变 THEN Action_API SHALL 在 Firefox 中正确更新图标
2. WHEN 设置徽章文本 THEN Action_API SHALL 在 Firefox 中正确显示徽章
3. WHEN 设置图标标题 THEN Action_API SHALL 在 Firefox 中正确显示悬停提示

### Requirement 10: Side Panel 功能降级

**User Story:** 作为用户，我希望在 Firefox 中有替代方案来访问 AriaNG 界面，因为 Firefox 不支持 Side Panel。

#### Acceptance Criteria

1. WHEN 扩展在 Firefox 中运行 THEN Extension SHALL 检测 Side Panel 不可用
2. WHEN Side Panel 不可用 THEN Extension SHALL 自动使用标签页或弹出窗口作为替代
3. WHEN 用户选择 Side Panel 模式 THEN Extension SHALL 在 Firefox 中显示提示并使用替代方案

### Requirement 11: 电源管理功能降级

**User Story:** 作为用户，我希望扩展在 Firefox 中能优雅处理不支持的电源管理功能。

#### Acceptance Criteria

1. WHEN 扩展调用 `chrome.power` API THEN Extension SHALL 检测 Firefox 是否支持
2. IF Firefox 不支持 power API THEN Extension SHALL 静默跳过相关功能而不报错

### Requirement 12: 系统显示信息功能降级

**User Story:** 作为用户，我希望扩展在 Firefox 中能正确处理窗口尺寸计算，即使没有 system.display API。

#### Acceptance Criteria

1. WHEN 需要获取屏幕尺寸 THEN Extension SHALL 检测 `system.display` API 可用性
2. IF `system.display` 不可用 THEN Extension SHALL 使用 `window.screen` 作为替代方案

### Requirement 13: Cookie API 兼容

**User Story:** 作为用户，我希望扩展在 Firefox 中能正确获取 Cookie 以便下载需要认证的文件。

#### Acceptance Criteria

1. WHEN 获取下载 URL 的 Cookie THEN Cookie_API SHALL 在 Firefox 中正确返回 Cookie
2. WHEN 处理隐私模式 Cookie THEN Extension SHALL 正确处理 Firefox 的隐私浏览模式

### Requirement 14: 构建和分发

**User Story:** 作为开发者，我希望能方便地为两个浏览器构建和分发扩展。

#### Acceptance Criteria

1. WHEN 构建扩展 THEN Build_System SHALL 能生成 Chrome 和 Firefox 两个版本
2. WHEN 打包扩展 THEN Build_System SHALL 生成符合各浏览器商店要求的包格式
3. THE Build_System SHALL 支持共享代码库，仅在必要时分离浏览器特定代码
