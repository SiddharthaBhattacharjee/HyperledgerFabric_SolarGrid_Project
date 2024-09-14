const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const app = express();
const port = 3002;

app.use(bodyParser.json());
app.use(cors());

// Function to read data from JSON file
const readData = () => {
  try {
    const data = fs.readFileSync('data.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return {};
  }
};

// Function to write data to JSON file
const writeData = (data) => {
  try {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data:', error);
  }
};

// Endpoint to get data
app.get('/getData', (req, res) => {
  const key = req.query.key;
  const data = readData();
  res.json(data[key] || null);
});

// Endpoint to save data
app.post('/saveData', (req, res) => {
  const { key, data } = req.body;
  const currentData = readData();
  currentData[key] = data;
  writeData(currentData);
  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
