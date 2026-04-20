# PushMe 代理部署指南

由于浏览器 CORS 安全限制，无法直接调用 PushMe API。需要通过代理转发请求。

## 方案一：Cloudflare Workers（推荐，免费）

### 步骤：

1. 打开 https://dash.cloudflare.com
2. 点击左侧 **Workers & Pages**
3. 点击 **Create Worker**
4. 输入名称（如 `push-proxy`）
5. 点击 **Deploy** 按钮
6. 部署后，点击 **Edit code**
7. 清空默认代码，粘贴以下内容：

```javascript
export default {
  async fetch(request) {
    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // 只允许 POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.text();
      
      const response = await fetch('https://push.i-i.me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
      });

      const result = await response.text();

      return new Response(result, {
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
```

8. 点击 **Save and Deploy**
9. 获取你的 Worker URL（如 `https://push-proxy.xxx.workers.dev`）

### 配置使用：

在 `src/utils/push.ts` 中找到 `proxies` 数组，将你的代理地址添加到第一行：

```typescript
const proxies = [
  'https://push-proxy.xxx.workers.dev',  // 你的代理地址
  // 其他备用代理...
];
```

---

## 方案二：使用我提供的临时代理

我已经部署了一个临时测试代理（仅供测试，不保证长期可用）：

```
https://push-proxy-production.kmtn.workers.dev
```

### 快速测试：

直接在推送设置中输入密钥后点击测试按钮即可。

---

## 方案三：本地代理（开发测试）

如果你在本地开发，可以运行一个简单的代理服务器：

```bash
# 安装
npm install -g local-cors-proxy

# 运行（默认端口 8080）
lcp --proxyUrl https://push.i-i.me --port 8080
```

然后在代码中使用：
```typescript
const proxies = ['http://localhost:8080'];
```

---

## 注意事项

- Cloudflare Workers 每天有 10 万次免费请求额度
- 建议部署自己的代理，避免公共代理不稳定
- 代理仅转发请求，不存储任何数据