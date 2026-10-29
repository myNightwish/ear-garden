# 听见 · 练耳小室

使用 Web Audio 生成标准音高的静态练耳工具。支持单音匹配、高低比较、低音短句、大小三和弦，以及按专题保存在浏览器中的练习记录与错题重练。

## 本地预览

在项目根目录执行：

```sh
python3 -m http.server 8765 --directory dist
```

打开 http://localhost:8765。

## 验证

```sh
node scripts/records.test.cjs
node --check dist/app.js
node --check dist/records.js
```

## Render 部署

根目录 `render.yaml` 定义 Render Static Site，仅发布 `dist/`。无需安装依赖、运行后端或配置环境变量。关联包含该文件的 Git 仓库后，可以使用 Render Blueprint 创建站点；也可以手动创建 Static Site，使用以下设置：

- Build Command: `node scripts/records.test.cjs && node --check dist/app.js && node --check dist/records.js`
- Publish Directory: `dist`
- Root Directory: 留空（本项目为仓库根目录时）

源码参考：https://render.com/docs/blueprint-spec

## 练习数据

数据只保存在当前浏览器的 localStorage 中，不上传到服务器。更换域名、浏览器或设备不会自动迁移记录。旧版总成绩使用 `ear-garden-stats`，分专题记录使用 `ear-garden-records-v1`。
