require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const { askOpenAI } = require('./src/utils/aiHelper');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const SITE_B_URL = process.env.SITE_B_URL;
const SITE_B_API_KEY = process.env.SITE_B_API_KEY;

// CORS 設定
const allowedOrigins = (process.env.ALLOW_UPDATE_ORIGINS || '').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS blocked'));
  }
}));

// MongoDB
let dbClient;
async function connectDb() {
  try {
    dbClient = new MongoClient(MONGODB_URI);
    await dbClient.connect();
    console.log('✅ MongoDB connected.');
  } catch (err) {
    console.error('MongoDB error:', err.message);
  }
}
connectDb();

// API: 狀態檢查
app.get('/api/status', (req, res) => res.json({ ok: true, time: new Date() }));

// API: 保存使用者指令
app.post('/api/save-instruction', async (req, res) => {
  try {
    const { instruction } = req.body;
    const db = dbClient.db();
    const result = await db.collection('instructions').insertOne({ instruction, createdAt: new Date() });
    res.json({ ok: true, id: result.insertedId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: AI 生成程式碼
app.post('/api/ai-update', async (req, res) => {
  try {
    const { instruction } = req.body;
    if (!instruction) return res.status(400).json({ error: 'instruction required' });

    const systemPrompt = `你是一個 Node.js 專案 AI 工程師，輸出 JSON 格式 { "files": [ { "path": "public/index.html", "content": "<HTML>" }, ... ] }`;
    const userPrompt = `使用者要求: ${instruction}，請生成完整檔案內容 JSON`;

    const aiResponse = await askOpenAI(systemPrompt, userPrompt);

    let parsed;
    try { parsed = JSON.parse(aiResponse); } 
    catch { return res.status(500).json({ error: 'AI 回傳非 JSON', ai_text: aiResponse }); }

    const db = dbClient.db();
    await db.collection('ai_responses').insertOne({ instruction, files: parsed.files, createdAt: new Date() });

    res.json({ ok: true, files: parsed.files });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: 送到 Site B
app.post('/api/send-to-deployer', async (req, res) => {
  try {
    const { files } = req.body;
    if (!files) return res.status(400).json({ error: 'files required' });

    const resp = await axios.post(SITE_B_URL, { files }, {
      headers: { 'X-API-KEY': SITE_B_API_KEY }
    });
    res.json({ ok: true, result: resp.data });
  } catch (e) {
    res.status(500).json({ error: e.message, detail: e.response?.data || null });
  }
});

app.listen(PORT, () => console.log(`🚀 Site A running at port ${PORT}`));
