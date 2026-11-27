const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'rates.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ensure database directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database
let db;
try {
  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);
  console.log(`Connected to SQLite database at: ${DB_PATH}`);
} catch (e) {
  console.error('SQLite initialization fallback:', e.message);
}

// Database schema initialization
function initDatabase() {
  if (!db) return;
  db.exec(`
    CREATE TABLE IF NOT EXISTS rbi_banks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bank_name TEXT UNIQUE NOT NULL,
      bank_type TEXT NOT NULL,
      senior_rate REAL NOT NULL,
      general_rate REAL NOT NULL,
      tenure_days INTEGER NOT NULL,
      tenure_label TEXT NOT NULL,
      penalty_senior REAL NOT NULL,
      penalty_general REAL NOT NULL,
      dicgc_insured INTEGER DEFAULT 1,
      last_verified TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT NOT NULL,
      banks_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      details TEXT
    );
  `);

  // Seed default 44 banks if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM rbi_banks').get().count;
  if (count === 0) {
    console.log('Seeding initial 44 RBI-scheduled banks into SQLite...');
    try {
      const banksDataPath = path.join(__dirname, 'banks_data.js');
      if (fs.existsSync(banksDataPath)) {
        const fileContent = fs.readFileSync(banksDataPath, 'utf8');
        const match = fileContent.match(/const\s+RBI_BANKS\s*=\s*(\[[\s\S]*?\]);/);
        if (match) {
          const banks = eval(match[1]);
          const insertStmt = db.prepare(`
            INSERT OR REPLACE INTO rbi_banks 
            (bank_name, bank_type, senior_rate, general_rate, tenure_days, tenure_label, penalty_senior, penalty_general, dicgc_insured, last_verified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          const now = new Date().toISOString();
          for (const b of banks) {
            insertStmt.run(
              b.bank,
              b.type || 'Small Finance Bank',
              b.senior_max_rate || 8.0,
              b.general_max_rate || 7.5,
              b.max_tenure_days || 365,
              b.max_tenure_label || '1 Year',
              b.penalty_senior || 0.0,
              b.penalty_general || 0.5,
              1,
              now
            );
          }
          console.log(`Successfully seeded ${banks.length} banks into SQLite.`);
        }
      }
    } catch (seedErr) {
      console.error('Error seeding SQLite data:', seedErr.message);
    }
  }
}

initDatabase();

// API: Get all bank rates from SQLite
app.get('/api/rates', (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Database not initialized' });
  }
  try {
    const banks = db.prepare('SELECT * FROM rbi_banks ORDER BY senior_rate DESC').all();
    const lastSync = db.prepare('SELECT * FROM sync_logs ORDER BY id DESC LIMIT 1').get();
    res.json({
      success: true,
      count: banks.length,
      lastSync: lastSync || { timestamp: new Date().toISOString(), status: 'Initial Seed' },
      banks
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: Trigger rate sync
app.post('/api/sync', (req, res) => {
  try {
    const { syncDatabase } = require('./sync_rates');
    const result = syncDatabase(DB_PATH);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dbPath: DB_PATH,
    connected: !!db
  });
});

// Catch-all route to serve index.html for SPA/Direct navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FD Optimization Server running on port ${PORT}`);
  console.log(`SQLite Database Path: ${DB_PATH}`);
});
