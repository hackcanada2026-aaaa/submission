const { execFile } = require('child_process');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const os = require('os');

const PRESAGE_BINARY = path.join(__dirname, '..', 'presage', 'build', 'presage_spot');
const PRESAGE_API_KEY = process.env.PRESAGE_API_KEY;
const DOCKER_IMAGE = 'pulselink-presage';

/** Request MP4 from Cloudinary so Presage gets a format it can decode (browser records WebM). */
function presageVideoUrl(url) {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('cloudinary.com') && url.includes('/video/upload/')) {
    return url.replace('/video/upload/', '/video/upload/f_mp4/');
  }
  return url;
}
const MAX_VIDEO_SECONDS = 8;

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

const trimVideo = (inputPath) => {
  return new Promise((resolve, reject) => {
    const trimmed = inputPath.replace(/\.mp4$/, '_trim.mp4');
    execFile('ffmpeg', [
      '-y', '-i', inputPath,
      '-t', String(MAX_VIDEO_SECONDS),
      '-c', 'copy',
      trimmed
    ], { timeout: 15000 }, (error) => {
      if (error) {
        // ffmpeg not available or failed — just use original
        console.log('ffmpeg trim skipped:', error.message);
        return resolve(inputPath);
      }
      resolve(trimmed);
    });
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
    let trimmedFile;
    try {
      const downloadUrl = presageVideoUrl(videoUrl);
      tmpFile = await downloadVideo(downloadUrl);
      trimmedFile = await trimVideo(tmpFile);
      const vitals = useDocker
        ? await getVitalsDocker(trimmedFile)
        : await getVitalsNative(trimmedFile);
      if (vitals && !vitals.error) {
        console.log('Presage vitals:', {
          readings_count: vitals.readings_count,
          pulse_rate: vitals.pulse_rate ?? '(none)',
          breathing_rate: vitals.breathing_rate ?? '(none)',
        });
      }
      res.json({ source: 'presage_smartspectra', data: vitals });
    } catch (err) {
      console.error('Presage error:', err.message);
      res.status(500).json({ error: 'Vitals analysis failed', details: err.message });
    } finally {
      if (tmpFile) fs.unlink(tmpFile, () => {});
      if (trimmedFile && trimmedFile !== tmpFile) fs.unlink(trimmedFile, () => {});
    }
  });
};
