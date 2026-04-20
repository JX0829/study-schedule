# PushMe CORS Proxy

用于解决浏览器直接调用 PushMe API 的 CORS 限制问题。

## 为什么需要代理？

PushMe API (https://push.i-i.me) 不支持浏览器 CORS，直接从浏览器调用会报错：
```
Failed to fetch
```

## 部署方案

### 方案一：Cloudflare Workers（推荐，免费）

1. 登录 https://dash.cloudflare.com
2. 进入 Workers & Pages
3. 创建新 Worker
4. 复制 `cloudflare-worker.js` 内容
5. 部署

部署后获得 URL 如：`https://push-proxy.xxx.workers.dev`

### 方案二：Vercel（免费）

1. 登录 https://vercel.com
2. 导入此文件夹
3. 自动部署

部署后获得 URL 如：`https://push-proxy.vercel.app`

### 方案三：本地代理（开发测试）

```bash
npm install
npm start
```

本地运行在 `http://localhost:3001`

## 使用方式

在 StudyPlan 推送设置中：

1. 填写 PushKey
2. 修改服务器地址为代理地址（如 `https://push-proxy.xxx.workers.dev`）
3. 点击测试

## 注意事项

- 代理服务免费，但建议不要公开分享地址
- 仅转发 PushMe 请求，不存储任何数据
- 请求失败时返回 PushMe 的原始错误信息