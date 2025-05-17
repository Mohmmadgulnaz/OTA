const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');  // For checksum

const app = express();
app.use(cors());

// ✅ Check for Update API
app.get('/api/check_update', async (req, res) => {
  const version = req.query.version;
  if (!version) return res.status(400).json({ error: 'Version is required' });

  try {
    // Mocking available versions if needed
    const response = {
      data: {
        availableVersions: ['v1.0.0', 'v1.0.1', 'v2.0.0']
      }
    };
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check update', details: error.message });
  }
});

// ✅ Download Update API
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

// ✅ Verify Update API (Checksum SHA256)
app.get('/api/verify_update', (req, res) => {
  const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.zip'));
  if (files.length === 0) return res.status(404).json({ error: 'No downloaded update file found' });

  const latestFile = files[files.length - 1]; // Latest downloaded file
  const filePath = path.join(__dirname, latestFile);

  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(filePath);

  stream.on('data', data => hash.update(data));
  stream.on('end', () => {
    const checksum = hash.digest('hex');
    res.json({ file: latestFile, checksum });
  });

  stream.on('error', (err) => {
    res.status(500).json({ error: 'Failed to verify checksum', details: err.message });
  });
});

app.listen(5000, () => {
  console.log('Backend running at http://localhost:5000');
});
