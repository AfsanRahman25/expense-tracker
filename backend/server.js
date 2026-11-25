const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// SQLite தரவுத்தளத்தை உருவாக்குதல் / இணைத்தல்
const db = new sqlite3.Database('./expenses.db', (err) => {
  if (err) console.error(err.message);
  console.log('SQLite தரவுத்தளத்துடன் இணைக்கப்பட்டது.');
});

// அட்டவணையை (Table) உருவாக்குதல்
db.run(`CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL
)`);

// பட்ஜெட் தொகையைச் சேமிக்கும் அட்டவணை (ஒரே ஒரு வரி மட்டும் இருக்கும்)
db.run(`CREATE TABLE IF NOT EXISTS budget (
  id INTEGER PRIMARY KEY,
  limit_amount REAL NOT NULL
)`, () => {
  // ஆரம்ப மதிப்பாக 0 அல்லது 10000 அமைத்தல்
  db.run(`INSERT OR IGNORE INTO budget (id, limit_amount) VALUES (1, 10000)`);
});


// 1. அனைத்து செலவுகளையும் எடுத்தல் (GET)
app.get('/api/expenses', (req, res) => {
  db.all('SELECT * FROM expenses ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. புதிய செலவைச் சேர்த்தல் (POST)
app.post('/api/expenses', (req, res) => {
  const { title, amount, category, date } = req.body;
  const sql = 'INSERT INTO expenses (title, amount, category, date) VALUES (?, ?, ?, ?)';
  db.run(sql, [title, amount, category, date], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, amount, category, date });
  });
});

// 3. செலவை நீக்குதல் (DELETE)
app.delete('/api/expenses/:id', (req, res) => {
  db.run('DELETE FROM expenses WHERE id = ?', req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deletedID: req.params.id });
  });
});

// 4. செலவைத் திருத்துதல் (PUT)
app.put('/api/expenses/:id', (req, res) => {
  const { title, amount, category, date } = req.body;
  const sql = 'UPDATE expenses SET title = ?, amount = ?, category = ?, date = ? WHERE id = ?';
  db.run(sql, [title, amount, category, date, req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updatedID: req.params.id });
  });
});

// 5. பட்ஜெட் தொகையைப் பெறுதல் (GET)
app.get('/api/budget', (req, res) => {
  db.get('SELECT limit_amount FROM budget WHERE id = 1', [], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ limit: row ? row.limit_amount : 0 });
  });
});

// 6. பட்ஜெட் தொகையைப் புதுப்பித்தல் (PUT)
app.put('/api/budget', (req, res) => {
  const { limit } = req.body;
  db.run('UPDATE budget SET limit_amount = ? WHERE id = 1', [limit], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ limit });
  });
});


app.listen(5000, () => {
  console.log('Backend சர்வர் http://localhost:5000 -ல் இயங்குகிறது');
});
