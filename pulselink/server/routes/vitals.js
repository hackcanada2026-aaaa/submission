const { execFile } = require('child_process');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');

const PRESAGE_BINARY = path.join(__dirname, '..', 'presage', 'build', 'presage_spot');
const PRESAGE_API_KEY = process.env.PRESAGE_API_KEY;
const DOCKER_IMAGE = 'pulselink-presage';

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

const getVitalsNative = (videoPath) => {
  return new Promise((resolve, reject) => {
    execFile(PRESAGE_BINARY, [PRESAGE_API_KEY, videoPath], { timeout: 60000 }, (error, stdout, stderr) => {
      if (error) return reject(new Error(`Presage binary failed: ${error.message}\nstderr: ${stderr}`));
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (parseErr) {
        reject(new Error(`Failed to parse Presage output: ${stdout}`));
      }
    });
  });
};

const getVitalsDocker = (videoPath) => {
  return new Promise((resolve, reject) => {
    const args = [
      'run', '--rm',
      '-v', `${videoPath}:/tmp/input.mp4:ro`,
      DOCKER_IMAGE,
      PRESAGE_API_KEY, '/tmp/input.mp4'
    ];
    execFile('docker', args, { timeout: 120000 }, (error, stdout, stderr) => {
      if (stderr) console.log('Presage stderr:', stderr);
      if (error) return reject(new Error(`Presage Docker failed: ${error.message}\nstderr: ${stderr}`));
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (parseErr) {
        reject(new Error(`Failed to parse Presage output: ${stdout}`));
      }
    });
  });
};

const useDocker = !fs.existsSync(PRESAGE_BINARY);

module.exports = (app) => {
  app.post('/api/vitals', async (req, res) => {
    const { videoUrl } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl required' });

    let tmpFile;
    try {
      tmpFile = await downloadVideo(videoUrl);
      const vitals = useDocker
        ? await getVitalsDocker(tmpFile)
        : await getVitalsNative(tmpFile);
      res.json({ source: 'presage_smartspectra', data: vitals });
    } catch (err) {
      console.error('Presage error:', err.message);
      res.status(500).json({ error: 'Vitals analysis failed', details: err.message });
    } finally {
      if (tmpFile) fs.unlink(tmpFile, () => {});
    }
  });
};
