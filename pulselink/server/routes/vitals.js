const { execFile } = require('child_process');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');

const PRESAGE_BINARY = path.join(__dirname, '..', 'presage', 'build', 'presage_spot');
const PRESAGE_API_KEY = process.env.PRESAGE_API_KEY;

const downloadVideo = (url) => {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), `presage_${Date.now()}.mp4`);
    const file = fs.createWriteStream(tmpFile);
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(tmpFile, () => {});
        return downloadVideo(res.headers.location).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(tmpFile); });
    }).on('error', (err) => { fs.unlink(tmpFile, () => {}); reject(err); });
  });
};

const getVitals = (videoUrl) => {
  return new Promise(async (resolve, reject) => {
    let tmpFile;
    try {
      tmpFile = await downloadVideo(videoUrl);
    } catch (err) {
      return reject(new Error(`Failed to download video: ${err.message}`));
    }

    execFile(PRESAGE_BINARY, [PRESAGE_API_KEY, tmpFile], { timeout: 60000 }, (error, stdout, stderr) => {
      fs.unlink(tmpFile, () => {});

      if (error) {
        return reject(new Error(`Presage binary failed: ${error.message}\nstderr: ${stderr}`));
      }

      try {
        const metrics = JSON.parse(stdout.trim());
        resolve(metrics);
      } catch (parseErr) {
        reject(new Error(`Failed to parse Presage output: ${stdout}`));
      }
    });
  });
};

module.exports = (app) => {
  app.post('/api/vitals', async (req, res) => {
    const { videoUrl } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl required' });

    if (!fs.existsSync(PRESAGE_BINARY)) {
      return res.json({ source: 'presage_smartspectra', data: null, warning: 'Presage binary not built' });
    }

    try {
      const vitals = await getVitals(videoUrl);
      res.json({ source: 'presage_smartspectra', data: vitals });
    } catch (err) {
      console.error('Presage error:', err.message);
      res.status(500).json({ error: 'Vitals analysis failed', details: err.message });
    }
  });
};
