# Focus Flow 0.1.1 Release Notes

## 状态

- 状态：候选版已生成
- 日期：2026-04-07
- 安装包：`src-tauri/target/release/bundle/dmg/Focus Flow_0.1.1_aarch64.dmg`
- App：`src-tauri/target/release/bundle/macos/Focus Flow.app`

## 本批次内容

- 新增桌面窗口“置顶 / 已置顶”按钮。
- 增加 Tauri always-on-top 权限配置。
- 保留最新版 logo 和 `.app + .dmg` 打包形式。
- 将版本号统一提升到 `0.1.1`。
- 新增 `RELEASE_PLAN.md` 和 `RELEASE_CHECKLIST.md`，明确后续批次发版节奏。
- 继续低风险组件化拆分：快速录入、Today 主线、工作台、流程视图、看板视图。
- 清理 `page.tsx` 中隐藏的重复 UI 区块。
- 新增数据目录设置：默认继续使用 AppData，可选择 `$HOME` 下自定义目录，也可恢复默认目录。
- 新增 `focus-flow-settings.json` 保存数据目录设置。
- 新增 Tauri dialog 插件用于选择目录。
- 新增快速录入 `Cmd+K` 聚焦、拆分数量预览、空输入禁用提交。
- 新增手动磁盘备份、复制数据位置、导入/重置/切换目录前自动备份。

## 验证结果

- `npm run lint`：通过。
- `npm run build`：通过。
- `npm run tauri:build`：通过。
- 打包后的 `.app`：已启动成功。
- `Info.plist`：`CFBundleShortVersionString` 和 `CFBundleVersion` 均为 `0.1.1`。
- 数据检查：`17` 条任务、`7` 个项目、`4` 个标签、`0` 个日报。
- 增量验证：加入 dialog 插件后 `npm run lint`、`npm run build`、`npm run tauri:build` 通过。
- 当前后续数据检查：`19` 条任务、`7` 个项目、`4` 个标签、`0` 个日报。

## 需要用户试用确认

- 点击置顶按钮后，窗口是否保持在其它窗口上方。
- 再次点击置顶按钮后，窗口是否恢复正常层级。
- 安装 DMG 后启动是否仍显示“磁盘存储”。
- 在工具箱里选择一个用户目录作为数据目录后，确认数据仍可读取。
- 恢复默认目录后，确认数据仍可读取。
