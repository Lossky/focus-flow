# Focus Flow Release Checklist

## 适用范围

这份清单用于每次准备生成 macOS 安装包前。目标是把“能不能发”变成固定步骤，而不是凭感觉打包。

## 发版前确认

- 确认当前批次已经收口，不能为了单个低风险功能临时发包。
- 确认 `package.json`、`package-lock.json`、`src-tauri/tauri.conf.json`、`src-tauri/Cargo.toml` 版本号一致。
- 确认本次没有计划外的数据结构迁移。
- 如果涉及存储、导入导出或迁移，先备份当前 AppData 数据文件。

## 必跑命令

```bash
npm run lint
npm run build
npm run tauri:build
```

## 数据安全检查

当前桌面默认数据目录：

```text
~/Library/Application Support/ai.openclaw.focusflow/
```

打包前后至少检查：

- `focus-flow-data.json` 存在。
- `items` 数量没有异常归零。
- `projects` 和 `tags` 数量没有异常归零。
- App 启动后显示“磁盘存储”。

## 冒烟测试

- 打开打包后的 `.app`。
- 确认快速录入可输入并可用 `Cmd+Enter` 添加。
- 确认 Today 主线显示正常。
- 确认置顶按钮可以在“置顶 / 已置顶”之间切换。
- 确认工作台、工具箱、番茄钟折叠区可展开。
- 确认流程视图和看板视图可切换。
- 确认导出备份按钮可触发下载。
- 如果本批次涉及数据目录，确认“选择数据目录”和“恢复默认目录”可用，并且切换前会先创建备份。

## Mac 小组件数据桥检查

仅当本批次涉及小组件时执行：

- 确认 AppData 下存在 `focus-flow-widget-snapshot.json`。
- 确认 `storage.healthy` 为 `true`。
- 确认 `counts.today`、`counts.mainline` 与 App 内显示大致一致。
- 确认 `nextItem` 有值，或在 Today 为空时为空。

## 产物记录

每次发包后记录：

- 版本号。
- DMG 路径。
- `.app` 路径。
- 验证命令结果。
- 数据检查结果。
- 如涉及自定义数据目录，记录当前数据目录路径。
