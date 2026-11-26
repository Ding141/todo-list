const express = require('express');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'planner.json');

fs.mkdirSync(DATA_DIR, { recursive: true });

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/data', (_req, res) => {
  if (!fs.existsSync(DATA_FILE)) return res.json(null);
  try {
    res.type('json').send(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    res.status(500).json({ error: 'read failed' });
  }
});

app.put('/api/data', (req, res) => {
  const body = req.body;
  if (!body || !Array.isArray(body.boards)) return res.status(400).json({ error: 'bad payload' });
  const tmp = DATA_FILE + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(body));
    fs.renameSync(tmp, DATA_FILE);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'write failed' });
  }
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`planner listening on :${PORT}`));
