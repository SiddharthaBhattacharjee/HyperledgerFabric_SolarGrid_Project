const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3002;

app.use(bodyParser.json());
app.use(cors());

// Initialize SQLite database
const db = new sqlite3.Database('data.db'); // to store in runtime memory Change 'data.db' to ':memory:' 

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS data (key TEXT PRIMARY KEY, value TEXT)");
});

// Endpoint to get data
app.get('/getData', (req, res) => {
  const key = req.query.key;
  db.get("SELECT value FROM data WHERE key = ?", [key], (err, row) => {
    if (err) {
      console.error('Error fetching data:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.json(row ? JSON.parse(row.value) : null);
    }
  });
});

// Endpoint to save data
app.post('/saveData', (req, res) => {
  const { key, data } = req.body;
  const value = JSON.stringify(data);
  db.run("INSERT OR REPLACE INTO data (key, value) VALUES (?, ?)", [key, value], (err) => {
    if (err) {
      console.error('Error saving data:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.sendStatus(200);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
