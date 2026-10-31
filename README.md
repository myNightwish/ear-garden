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
node scripts/practice.test.cjs && node --check dist/practice.js && node scripts/records.test.cjs
node --check dist/app.js
node --check dist/records.js
```

## Render 部署

根目录 `render.yaml` 定义 Render Static Site，仅发布 `dist/`。无需安装依赖、运行后端或配置环境变量。关联包含该文件的 Git 仓库后，可以使用 Render Blueprint 创建站点；也可以手动创建 Static Site，使用以下设置：

- Build Command: `node scripts/practice.test.cjs && node --check dist/practice.js && node scripts/records.test.cjs && node --check dist/app.js && node --check dist/records.js`
- Publish Directory: `dist`
- Root Directory: 留空（本项目为仓库根目录时）

源码参考：https://render.com/docs/blueprint-spec

## 练习数据

数据只保存在当前浏览器的 localStorage 中，不上传到服务器。更换域名、浏览器或设备不会自动迁移记录。旧版总成绩使用 `ear-garden-stats`，分专题记录使用 `ear-garden-records-v1`。

## 练习操作

每轮可选 10 或 20 题，显示完成进度与轮末总结。普通练习按题型组合打乱循环，连续两题不会完全相同；错题重练会还原原题。切换范围、音区、题量或刷新会重新开始本轮，累计记录保留。

- 空格：重听目标。
- 1–9：从左到右选择答案；第 10–12 项使用 0、-、=。
- Shift + 对应选项键：仅试听，不修改答案。
- Enter：确认；揭晓后再按进入下一题或下一轮。
- 低音短句：依次选择三个音，自动切换音位；左右方向键或点击音位可以修改。

表单下拉框、练习记录面板等控件保留自己的键盘操作。

## 音高与音色

默认使用纯净正弦音。两种音色共享十二平均律基频 `440 * 2 ** ((MIDI - 69) / 12)`；柔和合成音额外包含较弱的二次谐波（基频的两倍），不是钢琴采样。切换音色仅停止当前播放并更新显示，不更换题目、清空已选答案或重置本轮进度。错题重练仍计入原题所属专题。
