require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dns = require('dns');
const fs = require('fs');
const { URL } = require('url');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


const filePath = './public/data.json';

function loadData() {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]');
      return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return content ? JSON.parse(content) : [];
  } catch (err) {
    console.error('Error reading data file:', err);
    return [];
  }
}

function saveData(data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing data file:', err);
  }
}

function genShortUrl(existingShorts) {
  const min = 1;
  const max = (existingShorts.length || 1) * 1000;
  let short;

  do {
    short = Math.floor(Math.random() * (max - min + 1)) + min;
  } while (existingShorts.includes(short));

  return short;
}

app.post('/api/shorturl', (req, res) => {
  const input = req.body.url;

  let parsedUrl;
  try {
    parsedUrl = new URL(input);
  } catch (err) {
    return res.json({ error: 'invalid url' });
  }


  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const data = loadData();

    const existing = data.find(entry => entry.original_url === input);
    if (existing) {
      return res.json(existing);
    }

    const short = genShortUrl(data.map(entry => entry.short_url));

    const newEntry = {
      original_url: input,
      short_url: short
    };

    data.push(newEntry);
    saveData(data);

    res.json(newEntry);
  });
});

app.get('/api/shorturl/:shorturl', (req, res) => {
  const short = Number(req.params.shorturl);
  const data = loadData();

  const entry = data.find(d => d.short_url === short);

  if (entry) {
    return res.redirect(entry.original_url);
  } else {
    return res.json({ error: 'No short URL found for given input' });
  }
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
