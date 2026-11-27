const path = require('path');
const fs = require('fs');

function syncDatabase(customDbPath) {
  const DB_PATH = customDbPath || process.env.DB_PATH || path.join(__dirname, 'data', 'rates.db');
  console.log(`[2:00 AM Cron] Starting daily RBI bank rate sync on SQLite: ${DB_PATH}`);

  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (e) {
    console.error('better-sqlite3 not available:', e.message);
    return { status: 'error', message: e.message };
  }

  const db = new Database(DB_PATH);
  const now = new Date().toISOString();

  // Read current rates from banks_data.js
  const banksDataPath = path.join(__dirname, 'banks_data.js');
  if (!fs.existsSync(banksDataPath)) {
    throw new Error('banks_data.js not found');
  }

  const fileContent = fs.readFileSync(banksDataPath, 'utf8');
  const match = fileContent.match(/const\s+RBI_BANKS\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error('Could not parse RBI_BANKS data');
  }

  const banks = eval(match[1]);
  const updateStmt = db.prepare(`
    INSERT INTO rbi_banks (bank_name, bank_type, senior_rate, general_rate, tenure_days, tenure_label, penalty_senior, penalty_general, dicgc_insured, last_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(bank_name) DO UPDATE SET
      senior_rate = excluded.senior_rate,
      general_rate = excluded.general_rate,
      tenure_days = excluded.tenure_days,
      tenure_label = excluded.tenure_label,
      penalty_senior = excluded.penalty_senior,
      penalty_general = excluded.penalty_general,
      last_verified = excluded.last_verified;
  `);

  const tx = db.transaction((items) => {
    for (const b of items) {
      updateStmt.run(
        b.bank,
        b.type || 'Scheduled Commercial Bank',
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
  });

  tx(banks);

  // Log sync outcome
  db.prepare(`
    INSERT INTO sync_logs (timestamp, banks_count, status, details)
    VALUES (?, ?, ?, ?)
  `).run(now, banks.length, 'SUCCESS', 'Daily 2:00 AM IST scheduled refresh completed successfully');

  console.log(`[2:00 AM Cron] Successfully synchronized ${banks.length} RBI banks in SQLite at ${now}`);
  return { status: 'success', banksCount: banks.length, timestamp: now };
}

// Allow CLI execution directly from Render Cron: `node sync_rates.js`
if (require.main === module) {
  try {
    const result = syncDatabase();
    console.log('Sync result:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Fatal sync error:', err);
    process.exit(1);
  }
}

module.exports = { syncDatabase };
