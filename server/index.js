/**
 * StudyPlan MongoDB Backend Server
 * 
 * 提供简单的键值存储 API，用于替代 localStorage
 * 增强版：自动重连、优雅降级、健康监控
 * 
 * MongoDB 连接: mongodb://192.168.31.170:27017
 * 数据库名: studyplan
 * 集合名: storage
 */

const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3002;

// MongoDB 连接配置
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'studyplan';
const COLLECTION_NAME = 'storage';

// 重连配置
const RECONNECT_INTERVAL_MS = 5000; // 5秒重试
const MAX_RECONNECT_ATTEMPTS = 0; // 0 = 无限重试

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB 客户端
let mongoClient = null;
let db = null;
let collection = null;
let mongoConnected = false; // 连接状态标志
let reconnectAttempts = 0;
let reconnectTimer = null;

/**
 * 连接 MongoDB（带自动重连）
 */
async function connectMongo() {
  try {
    if (mongoClient) {
      try { await mongoClient.close(); } catch (e) { /* ignore */ }
    }

    mongoClient = new MongoClient(MONGO_URL, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });

    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    collection = db.collection(COLLECTION_NAME);

    // 监听连接断开事件
    mongoClient.on('close', () => {
      console.warn('⚠️ MongoDB 连接断开，将在', RECONNECT_INTERVAL_MS / 1000, '秒后重连...');
      mongoConnected = false;
      scheduleReconnect();
    });

    mongoClient.on('error', (err) => {
      console.error('❌ MongoDB 错误:', err.message);
      mongoConnected = false;
      scheduleReconnect();
    });

    console.log(`✅ MongoDB 连接成功: ${MONGO_URL}`);

    // 确保索引存在
    try {
      await collection.dropIndex('key_1').catch(() => {});
      await collection.createIndex({ key: 1, familyId: 1 }, { unique: true });
      console.log('📌 索引就绪: { key: 1, familyId: 1 }');
    } catch (e) {
      console.warn('⚠️ 索引创建警告:', e.message);
    }

    mongoConnected = true;
    reconnectAttempts = 0;
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    mongoConnected = false;
    scheduleReconnect();
  }
}

/**
 * 调度重连
 */
function scheduleReconnect() {
  if (reconnectTimer) return; // 已有重连任务

  if (MAX_RECONNECT_ATTEMPTS > 0 && reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('❌ 已达最大重连次数，停止重连');
    return;
  }

  console.log(`🔄 将在 ${RECONNECT_INTERVAL_MS / 1000}s 后重连 (第 ${reconnectAttempts + 1} 次)...`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    reconnectAttempts++;
    connectMongo();
  }, RECONNECT_INTERVAL_MS);
}

/**
 * 检查 MongoDB 是否就绪的中间件
 */
function requireMongo(req, res, next) {
  if (!mongoConnected || !collection) {
    return res.status(503).json({
      success: false,
      error: 'MongoDB not connected, retry later',
    });
  }
  next();
}

// ============ API 路由 ============

/**
 * 健康检查 - 不依赖 MongoDB 也能返回
 */
app.get('/api/health', async (req, res) => {
  const result = {
    success: true,
    message: 'Server is running',
    mongoUrl: MONGO_URL,
    dbName: DB_NAME,
    mongoConnected,
    uptime: process.uptime(),
    reconnectAttempts,
  };

  if (mongoConnected) {
    try {
      await db.command({ ping: 1 });
      result.mongoPing = 'ok';
    } catch (e) {
      result.mongoPing = 'failed';
      result.success = false;
    }
  }

  res.json(result);
});

/**
 * 获取所有键
 */
app.get('/api/storage/keys', requireMongo, async (req, res) => {
  try {
    const { familyId } = req.query;
    const filter = {};
    if (familyId) filter.familyId = familyId;
    const docs = await collection.find(filter).project({ key: 1 }).toArray();
    res.json({ success: true, keys: docs.map(doc => doc.key) });
  } catch (error) {
    console.error('KEYS error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 清空数据
 */
app.delete('/api/storage/clear', requireMongo, async (req, res) => {
  try {
    const { familyId } = req.query;
    const filter = {};
    if (familyId) filter.familyId = familyId;
    await collection.deleteMany(filter);
    res.json({ success: true });
  } catch (error) {
    console.error('CLEAR error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 批量获取
 */
app.post('/api/storage/batch', requireMongo, async (req, res) => {
  try {
    const { keys, familyId } = req.body;
    const filter = { key: { $in: keys } };
    if (familyId) filter.familyId = familyId;
    const docs = await collection.find(filter).toArray();
    const result = {};
    for (const doc of docs) result[doc.key] = doc.value;
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('BATCH error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 批量设置
 */
app.post('/api/storage/batch-set', requireMongo, async (req, res) => {
  try {
    const { items, familyId } = req.body;
    const fid = familyId || 'default';
    const operations = items.map(item => ({
      updateOne: {
        filter: { key: item.key, familyId: fid },
        update: {
          $set: { key: item.key, value: item.value, familyId: fid, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    }));
    if (operations.length > 0) await collection.bulkWrite(operations);
    res.json({ success: true });
  } catch (error) {
    console.error('BATCH-SET error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取单个
 */
app.get('/api/storage/:key', requireMongo, async (req, res) => {
  try {
    const { key } = req.params;
    const { familyId } = req.query;
    const query = { key };
    if (familyId) query.familyId = familyId;
    const doc = await collection.findOne(query);
    res.json({ success: true, data: doc ? doc.value : null });
  } catch (error) {
    console.error('GET error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 设置单个
 */
app.post('/api/storage/:key', requireMongo, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, familyId } = req.body;
    const fid = familyId || 'default';
    const filter = { key };
    if (familyId) filter.familyId = familyId;
    await collection.updateOne(filter, {
      $set: { key, value, familyId: fid, updatedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    }, { upsert: true });
    res.json({ success: true });
  } catch (error) {
    console.error('POST error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 删除
 */
app.delete('/api/storage/:key', requireMongo, async (req, res) => {
  try {
    const { key } = req.params;
    const { familyId } = req.query;
    const filter = { key };
    if (familyId) filter.familyId = familyId;
    await collection.deleteOne(filter);
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 统计信息
 */
app.get('/api/stats', requireMongo, async (req, res) => {
  try {
    const count = await collection.countDocuments();
    const families = await collection.distinct('familyId');
    res.json({ success: true, stats: { totalRecords: count, families } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 迁移
 */
app.post('/api/migrate', requireMongo, async (req, res) => {
  try {
    const { data, familyId = 'default' } = req.body;
    const items = Object.entries(data).map(([key, value]) => ({ key, value, familyId }));
    const operations = items.map(item => ({
      updateOne: {
        filter: { key: item.key, familyId: item.familyId },
        update: {
          $set: { key: item.key, value: item.value, familyId: item.familyId, updatedAt: new Date(), migratedAt: new Date() },
          $setOnInsert: { createdAt: new Date() },
        },
        upsert: true,
      },
    }));
    if (operations.length > 0) await collection.bulkWrite(operations);
    res.json({ success: true, message: `迁移完成，共 ${items.length} 条数据` });
  } catch (error) {
    console.error('MIGRATE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============ 启动 ============

async function start() {
  await connectMongo();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 StudyPlan Server 运行在 http://0.0.0.0:${PORT}`);
    console.log(`📊 MongoDB: ${MONGO_URL}/${DB_NAME}`);
    console.log(`💡 健康检查: http://localhost:${PORT}/api/health`);
  });

  // 定期检查 MongoDB 连接（心跳）
  setInterval(async () => {
    if (!mongoConnected) {
      console.warn('⚠️ MongoDB 未连接，等待重连...');
    }
  }, 30000);
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n🛑 正在关闭服务器...');
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (mongoClient) {
    try { await mongoClient.close(); } catch (e) {}
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 收到 SIGTERM，正在关闭...');
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (mongoClient) {
    try { await mongoClient.close(); } catch (e) {}
  }
  process.exit(0);
});

start();
