/**
 * Cloudflare Worker - PushMe CORS Proxy
 * 
 * 部署步骤：
 * 1. 登录 https://dash.cloudflare.com
 * 2. Workers & Pages → Create Worker
 * 3. 粘贴此代码
 * 4. Save and Deploy
 */

export default {
  async fetch(request) {
    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      // 解析请求体
      const contentType = request.headers.get('Content-Type') || '';
      let params;
      
      if (contentType.includes('application/x-www-form-urlencoded')) {
        const text = await request.text();
        params = new URLSearchParams(text);
      } else if (contentType.includes('application/json')) {
        const json = await request.json();
        params = new URLSearchParams();
        for (const [key, value] of Object.entries(json)) {
          params.append(key, value);
        }
      } else {
        // 兼容 GET 参数格式
        const url = new URL(request.url);
        params = url.searchParams;
      }

      // 转发到 PushMe API
      const pushMeResponse = await fetch('https://push.i-i.me', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const result = await pushMeResponse.text();

      // 返回结果（带 CORS 头）
      return new Response(result, {
        status: pushMeResponse.status,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    } catch (error) {
      return new Response(`Error: ${error.message}`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  },
};

// 处理 OPTIONS 预检请求
addEventListener('fetch', event => {
  if (event.request.method === 'OPTIONS') {
    event.respondWith(new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }));
  } else {
    event.respondWith(handler(event.request));
  }
});

async function handler(request) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const text = await request.text();
    const params = new URLSearchParams(text);

    const pushMeResponse = await fetch('https://push.i-i.me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await pushMeResponse.text();

    return new Response(result, {
      headers: {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}