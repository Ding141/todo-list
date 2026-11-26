# 日程规划

一个自己用的三层日程规划网页：板块（课程 / 科研 / 生活）→ 事项 → 子任务，逐层点击展开。
数据存在服务器上的单个 JSON 文件里，同时浏览器本地留一份副本，断网也能看。

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
