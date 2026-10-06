# 皮卡丘 3D 模型展厅

静态网站，包含皮卡丘 GLB 模型、Blender 源文件和渲染截图。

## 在线发布

- Netlify：在 https://app.netlify.com/drop 登录，将解压后的整个网站文件夹拖入即可发布。
- GitHub Pages：将此文件夹内的文件放到仓库根目录，在 Settings → Pages 选择 Deploy from a branch、main 分支和 /(root)。
- Vercel：将网站文件提交到 GitHub 仓库，导入项目，Framework Preset 选择 Other，无须构建命令。

## 本地预览

在此目录运行 `python -m http.server 8080`，浏览器打开 http://localhost:8080 。

功能：鼠标拖动或触摸旋转、滚轮或双指缩放、自动旋转、重置视角、全屏（浏览器支持时）、模型及截图下载。

3D 查看器使用 @google/model-viewer 4.1.0（Apache-2.0），脚本随网站提供。
