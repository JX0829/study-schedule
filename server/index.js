/**
 * StudyPlan MongoDB Backend Server
 * 
 * 提供简单的键值存储 API，用于替代 localStorage
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
const MONGO_URL = process.env.MONGO_URL || 'mongodb://192.168.31.170:27017';
const DB_NAME = 'studyplan';
const COLLECTION_NAME = 'storage';

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB 客户端
let mongoClient = null;
let db = null;
let collection = null;

/**
 * 连接 MongoDB
 */
async function connectMongo() {
  try {
    mongoClient = new MongoClient(MONGO_URL);
    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    collection = db.collection(COLLECTION_NAME);
    console.log(`✅ MongoDB 连接成功: ${MONGO_URL}`);
    
    // 先删除旧的单一字段索引（如果存在）
    try {
      await collection.dropIndex('key_1');
      console.log('🗑️ 已删除旧索引 key_1');
    } catch (e) {
      // 索引不存在，忽略
    }

    // 创建复合索引（提高查询效率）
    // key + familyId 组合唯一，允许不同家庭使用相同的键名
    await collection.createIndex({ key: 1, familyId: 1 }, { unique: true });
    console.log('📌 已创建复合索引: { key: 1, familyId: 1 }');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
}

// 特殊路由必须在动态路由之前定义

/**
 * 获取所有键
 * GET /api/storage/keys?familyId=xxx
 */
app.get('/api/storage/keys', async (req, res) => {
  try {
    const { familyId } = req.query;

    const filter = {};
    if (familyId) {
      filter.familyId = familyId;
    }

    const docs = await collection.find(filter).project({ key: 1 }).toArray();
    const keys = docs.map(doc => doc.key);

    res.json({ success: true, keys });
  } catch (error) {
    console.error('KEYS error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 清空所有数据
 * DELETE /api/storage/clear?familyId=xxx
 */
app.delete('/api/storage/clear', async (req, res) => {
  try {
    const { familyId } = req.query;

    const filter = {};
    if (familyId) {
      filter.familyId = familyId;
    }

    await collection.deleteMany(filter);

    res.json({ success: true });
  } catch (error) {
    console.error('CLEAR error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 批量获取数据
 * POST /api/storage/batch
 * Body: { keys: [...] }
 */
app.post('/api/storage/batch', async (req, res) => {
  try {
    const { keys, familyId } = req.body;

    const filter = { key: { $in: keys } };
    if (familyId) {
      filter.familyId = familyId;
    }

    const docs = await collection.find(filter).toArray();
    const result = {};
    
    for (const doc of docs) {
      result[doc.key] = doc.value;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('BATCH error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 批量设置数据
 * POST /api/storage/batch-set
 * Body: { items: [{ key, value }] }
 */
app.post('/api/storage/batch-set', async (req, res) => {
  try {
    const { items, familyId } = req.body;

    const operations = items.map(item => ({
      updateOne: {
        filter: { key: item.key, familyId: familyId || 'default' },
        update: {
          $set: {
            key: item.key,
            value: item.value,
            familyId: familyId || 'default',
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await collection.bulkWrite(operations);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('BATCH-SET error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 获取数据
 * GET /api/storage/:key
 * GET /api/storage/:key?familyId=xxx
 */
app.get('/api/storage/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { familyId } = req.query;

    const query = { key };
    if (familyId) {
      query.familyId = familyId;
    }

    const doc = await collection.findOne(query);

    if (!doc) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: doc.value });
  } catch (error) {
    console.error('GET error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 设置数据
 * POST /api/storage/:key
 * Body: { value: ..., familyId?: ... }
 */
app.post('/api/storage/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value, familyId } = req.body;

    const filter = { key };
    if (familyId) {
      filter.familyId = familyId;
    }

    const update = {
      $set: {
        key,
        value,
        familyId: familyId || 'default',
        updatedAt: new Date(),
      },
      $setOnInsert: {
        createdAt: new Date(),
      },
    };

    await collection.updateOne(filter, update, { upsert: true });

    res.json({ success: true });
  } catch (error) {
    console.error('POST error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 删除数据
 * DELETE /api/storage/:key
 */
app.delete('/api/storage/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { familyId } = req.query;

    const filter = { key };
    if (familyId) {
      filter.familyId = familyId;
    }

    await collection.deleteOne(filter);

    res.json({ success: true });
  } catch (error) {
    console.error('DELETE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});







/**
 * 健康检查
 */
app.get('/api/health', async (req, res) => {
  try {
    // 测试 MongoDB 连接
    await db.command({ ping: 1 });
    res.json({ 
      success: true, 
      message: 'Server and MongoDB are healthy',
      mongoUrl: MONGO_URL,
      dbName: DB_NAME,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'MongoDB connection failed',
      details: error.message,
    });
  }
});

/**
 * 获取统计信息
 */
app.get('/api/stats', async (req, res) => {
  try {
    const count = await collection.countDocuments();
    const families = await collection.distinct('familyId');
    
    res.json({
      success: true,
      stats: {
        totalRecords: count,
        families: families,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 迁移 localStorage 数据到 MongoDB
 * POST /api/migrate
 * Body: { data: { key1: value1, key2: value2, ... }, familyId?: ... }
 */
app.post('/api/migrate', async (req, res) => {
  try {
    const { data, familyId = 'default' } = req.body;

    const items = Object.entries(data).map(([key, value]) => ({
      key,
      value,
      familyId,
    }));

    const operations = items.map(item => ({
      updateOne: {
        filter: { key: item.key, familyId: item.familyId },
        update: {
          $set: {
            key: item.key,
            value: item.value,
            familyId: item.familyId,
            updatedAt: new Date(),
            migratedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await collection.bulkWrite(operations);
    }

    res.json({ 
      success: true, 
      message: `迁移完成，共 ${items.length} 条数据`,
    });
  } catch (error) {
    console.error('MIGRATE error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动服务器
async function start() {
  await connectMongo();
  
  app.listen(PORT, () => {
    console.log(`🚀 StudyPlan Server 运行在 http://localhost:${PORT}`);
    console.log(`📊 MongoDB: ${MONGO_URL}/${DB_NAME}`);
    console.log(`💡 API 文档: http://localhost:${PORT}/api/health`);
  });
}

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭服务器...');
  if (mongoClient) {
    await mongoClient.close();
  }
  process.exit(0);
});

start();