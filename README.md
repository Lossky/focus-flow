# 灯塔 N-07 · 原创机器人展厅

静态网站，可直接部署到支持静态文件的托管服务。网站支持模型旋转与缩放、自动旋转、正侧背视角、重置视角、全屏查看，以及 GLB、Blender 和 PNG 下载；适配手机屏幕。

## 文件

- `index.html`：页面、样式与交互。
- `assets/robot.glb`：交互模型。
- `assets/robot.blend`：Blender 源文件。
- `assets/robot.png`：模型渲染图与加载封面。
- `assets/model-viewer.min.js`：本地 model-viewer 脚本。
- `assets/studio.hdr`：模型环境光照。

所有资源使用相对路径，不依赖外部字体或 CDN。模型与静态资源需一同放置并发布。

## 本地预览

在本目录启动静态文件服务器：

```sh
python3 -m http.server 8000
```

然后在浏览器打开 `http://localhost:8000/`。直接通过文件协议打开页面可能无法加载模型或脚本。

## 发布

将此目录中的文件完整上传到静态托管服务，保留 `assets` 目录结构，并将 `index.html` 设为首页。
