// ============================================================================
// LOKATOR.NG — HIGH-PERFORMANCE STATIC & MEDIA STREAMING SERVER
// Supports: HTTP/2 Range Requests (iOS Safari MP4 Streaming), CORS, 0.0.0.0 Binding
// ============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf'
};

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL & determine file path
  let parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (pathname === '/' || pathname === '') {
    pathname = '/index.html';
  }

  let filePath = path.join(ROOT_DIR, pathname);

  // Security check: ensure within root
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      // If file not found, try appending .html
      if (path.extname(filePath) === '') {
        const htmlPath = filePath + '.html';
        if (fs.existsSync(htmlPath)) {
          filePath = htmlPath;
          stats = fs.statSync(htmlPath);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>404 Not Found</h1><p>The requested file does not exist on Lokator server.</p>');
          return;
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1><p>The requested file does not exist on Lokator server.</p>');
        return;
      }
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>404 Not Found</h1>');
        return;
      }
      stats = fs.statSync(filePath);
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const totalSize = stats.size;
    const range = req.headers.range;

    // HTTP Range Requests for iOS Safari video streaming & media seeking
    if (range && (ext === '.mp4' || ext === '.webm')) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize || start > end) {
        res.writeHead(416, {
          'Content-Range': `bytes */${totalSize}`
        });
        res.end();
        return;
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600'
      });

      fileStream.pipe(res);
    } else {
      // Standard static file serving
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=86400'
      });

      fs.createReadStream(filePath).pipe(res);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIPs();
  console.log('====================================================');
  console.log('🚀 LOKATOR.NG DEV & MEDIA SERVER ACTIVE');
  console.log('====================================================');
  console.log(`💻 Local (Laptop):       http://localhost:${PORT}`);
  console.log(`💻 Local (Loopback):     http://127.0.0.1:${PORT}`);
  localIps.forEach(ip => {
    console.log(`📱 Mobile (Same Wi-Fi):   http://${ip}:${PORT}`);
  });
  console.log('====================================================');
  console.log('Available Pages:');
  console.log(`• Home:       http://localhost:${PORT}/index.html`);
  console.log(`• Directory:  http://localhost:${PORT}/search.html`);
  console.log(`• Register:   http://localhost:${PORT}/register.html`);
  console.log(`• Login:      http://localhost:${PORT}/login.html`);
  console.log(`• Dashboard:  http://localhost:${PORT}/dashboard.html`);
  console.log(`• Profile #1: http://localhost:${PORT}/profile.html?id=1`);
  console.log('====================================================\n');
});
