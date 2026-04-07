# Focus Flow macOS App Setup

已经为项目接入了 Tauri 基础配置。

## 已完成
- 新增 `src-tauri/` 目录
- 新增 Tauri Rust 入口
- 新增 `tauri.conf.json`
- 调整 Next.js 为静态导出模式
- 新增 npm scripts:
  - `npm run tauri:dev`
  - `npm run tauri:build`
- 新增桌面端数据持久化雏形：Tauri 环境优先写入 appData 目录，本地浏览器环境保留 localStorage 兜底
- 新增导出备份 / 导入备份 / 重置数据按钮
- 新增数据位置设置：默认 AppData，可选择用户目录下的自定义数据目录，也可恢复默认目录
- 新增 Tauri FS 插件注册和默认 capability，限制文件访问范围在 AppData 目录
- 移除构建期联网下载 Google Fonts 的依赖，保证静态导出可离线构建
- 新增正式 app icon 生成流程，图标源来自本地设计稿并生成到 `src-tauri/icons/`
- 打包目标包含 `.app` 和 `.dmg`，便于本机拖拽安装

## 现在的技术路线
- 前端：Next.js 16 + React 19
- 桌面壳：Tauri 2
- 构建模式：Next.js static export -> `out/` -> Tauri bundle
- macOS 产物：`src-tauri/target/release/bundle/macos/Focus Flow.app`
- macOS 安装包：`src-tauri/target/release/bundle/dmg/`
- 默认数据目录：`~/Library/Application Support/ai.openclaw.focusflow/`
- 默认数据文件：`focus-flow-data.json`
- 设置文件：`focus-flow-settings.json`

## 你后面要做的事（如果要本机运行）
1. 安装依赖
   ```bash
   npm install
   ```
2. 确保安装 Rust toolchain
   ```bash
   cargo --version
   ```
   当前机器已经通过 Homebrew 安装了 Rust/Cargo。
3. 开发模式运行
   ```bash
   npm run tauri:dev
   ```
4. 构建 macOS app 和 DMG 安装包
   ```bash
   npm run tauri:build
   ```

## 下一步建议
- 做稳定版持久化体验（增加错误提示、自动备份、数据位置展示）
- 调整窗口标题栏与菜单体验
- 增加导入/导出能力的细节优化（自动备份、手动恢复）
- 参考 `MAC_WIDGET_PLAN.md` 规划 macOS WidgetKit 小组件
