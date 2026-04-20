# MongoDB 存储迁移说明

## 概述

已将 localStorage 存储迁移到 MongoDB，实现云端数据存储。

## 数据流向

```
写入流程:
用户操作 → Zustand Store → 内存缓存 → localStorage → MongoDB（异步）

读取流程:
MongoDB（启动时） → 内存缓存 → Zustand Store → 用户界面
```

## 服务端

### 启动 MongoDB 后端服务

```bash
cd server
npm install
npm start
```

服务运行在 `http://localhost:3002`

### API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/storage/:key` | GET | 获取数据 |
| `/api/storage/:key` | POST | 设置数据 |
| `/api/storage/:key` | DELETE | 删除数据 |
| `/api/storage/keys` | GET | 获取所有键 |
| `/api/storage/batch` | POST | 批量获取 |
| `/api/storage/batch-set` | POST | 批量设置 |
| `/api/migrate` | POST | 迁移 localStorage |
| `/api/health` | GET | 健康检查 |

### MongoDB 连接配置

默认连接地址: `mongodb://192.168.31.170:27017`

可通过环境变量修改:
```bash
MONGO_URL=mongodb://localhost:27017 npm start
```

## 客户端

### 存储架构

- **内存缓存**: 快速同步读写
- **localStorage**: 备份存储
- **MongoDB**: 持久化云端存储

### 初始化

应用启动时会自动从 MongoDB 加载数据到内存。

如需手动初始化:
```typescript
import { initStores } from '@/store';

await initStores('family-id');
```

### 迁移 localStorage 数据

如果已有 localStorage 数据，可以迁移到 MongoDB:
```typescript
import { migrateToMongoDB } from '@/utils/storage';

await migrateToMongoDB('family-id');
```

## 配置

### MongoDB 地址配置

修改 `src/utils/mongoStorage.ts`:
```typescript
const DEFAULT_API_URL = 'http://localhost:3002';
```

### 家庭ID配置

数据按 familyId 分组存储，切换家庭时会自动切换数据组。

## 注意事项

1. **离线支持**: localStorage 作为备份，即使 MongoDB 连接失败也能工作
2. **数据同步**: 写入时同步更新缓存，异步写入 MongoDB
3. **批量优化**: 多次连续写入会合并为一个批量请求
4. **启动加载**: 应用启动时一次性加载所有数据

## 测试

访问健康检查接口:
```bash
curl http://localhost:3002/api/health
```

返回:
```json
{
  "success": true,
  "message": "Server and MongoDB are healthy",
  "mongoUrl": "mongodb://192.168.31.170:27017",
  "dbName": "studyplan"
}
```