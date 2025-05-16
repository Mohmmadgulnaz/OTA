const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Check for Update API
app.get('/api/check_update', async (req, res) => {
  const version = req.query.version;
  if (!version) return res.status(400).json({ error: 'Version is required' });

  try {
    const response = await axios.get(`https://oemserverapp.onrender.com/fota/check-update/?version=${version}`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check update', details: error.message });
  }
});

// Download Update API
app.get('/api/download_update/:version', async (req, res) => {
  const version = req.params.version;
  if (!version) return res.status(400).json({ error: 'Version is required' });

  try {
    const url = `https://oemserverapp.onrender.com/fota/download/${version}`;
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
    });

    const filePath = path.join(__dirname, `${version}.zip`);
    const writer = fs.createWriteStream(filePath);

    response.data.pipe(writer);

    writer.on('finish', () => {
      res.download(filePath, `${version}.zip`, (err) => {
        if (err) console.error('Download error:', err);
        fs.unlinkSync(filePath); // Delete file after sending
      });
    });

    writer.on('error', () => {
      res.status(500).json({ error: 'Failed to download update file' });
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to download update', details: error.message });
  }
});

app.listen(5000, () => {
  console.log('Backend running at http://localhost:5000');
});
