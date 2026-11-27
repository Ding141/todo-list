# 日程规划

一个自己用的三层日程规划网页：板块（课程 / 科研 / 生活）→ 事项 → 子任务，逐层点击展开。
右侧是月历：鼠标移到任意子任务上，月历会用色带标出它的起止日期（当前月份没有覆盖该日程时会自动翻页，移开后翻回）。手机上可以点按子任务，再向下查看月历。
子任务可以设置开始 / 结束日期，事项可以设置截止日期。

数据存在服务器上的单个 JSON 文件里，同时浏览器本地留一份副本。字体（Geist / Instrument Serif）已打包在 `public/fonts`，不依赖外网。
旧版本保存的数据会在加载时自动补全日期字段，无需手动迁移。

## 本地直接跑

```bash
npm install
npm start
```

打开 http://localhost:3000 。没有后端时，直接用浏览器打开 `public/index.html` 也能用，数据只存在本机浏览器里。

## Docker 部署（云服务器）

```bash
docker compose up -d --build
```

数据保存在名为 `planner-data` 的 volume 里，重建容器不会丢。改端口就改 `docker-compose.yml` 里的 `3000:3000`。

## 通过 Tailscale 访问

服务器上装好 Tailscale 后，同一 tailnet 内的设备直接访问 `http://<服务器的 tailscale IP>:3000`，不需要公网端口，也不需要额外配置。

## 备份

页面右上角可以导出 / 导入 JSON。服务器上的原始文件在 volume 里：

```bash
docker compose cp planner:/app/data/planner.json ./backup.json
```
