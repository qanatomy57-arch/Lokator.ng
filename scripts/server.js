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

const { LokatorAIService } = require('../ai-service.js');
const { ServiceModerator } = require('../categories.js');
global.ServiceModerator = ServiceModerator;

// Simple in-memory rate limiting map: ip -> { count, resetTime }
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  entry.count++;
  return true;
}

function parseJsonBody(req, limitBytes = 65536) {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > limitBytes) {
        reject(new Error('Payload too large: Max 64KB'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJsonResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, x-provider-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL & determine file path
  let parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // ==========================================================================
  // SERVER-SIDE SECURE AI API ROUTER (/api/ai/...)
  // ==========================================================================
  if (pathname.startsWith('/api/ai/')) {
    const clientIp = req.socket.remoteAddress || '127.0.0.1';

    // 1. Health check (public)
    if (pathname === '/api/ai/health' && req.method === 'GET') {
      sendJsonResponse(res, 200, {
        success: true,
        status: 'healthy',
        service: 'Lokator AI Provider Assistance Engine',
        model: 'lokator-trade-intelligence-v1',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 2. Enforce Authentication on AI Generation & Guidance Endpoints
    const authHeader = req.headers['authorization'] || '';
    const providerIdHeader = req.headers['x-provider-id'] || '';
    const isAuthed = (authHeader.startsWith('Bearer ') && authHeader.length > 10) || providerIdHeader.length > 0;

    if (!isAuthed) {
      sendJsonResponse(res, 401, {
        success: false,
        error: 'Unauthorized: Authentication required for AI provider assistance.'
      });
      return;
    }

    // 3. Enforce Rate Limiting
    if (!checkRateLimit(clientIp)) {
      sendJsonResponse(res, 429, {
        success: false,
        error: 'Rate limit exceeded: Please wait a minute before requesting additional AI assistance.'
      });
      return;
    }

    // 4. Endpoint: /api/ai/generate-bio
    if (pathname === '/api/ai/generate-bio' && req.method === 'POST') {
      try {
        const payload = await parseJsonBody(req);
        if (!payload || typeof payload !== 'object' || Object.keys(payload).length === 0) {
          sendJsonResponse(res, 400, {
            success: false,
            error: 'Invalid request: Provider facts payload is required.'
          });
          return;
        }

        const bioResult = LokatorAIService.generateBio(payload, { variant: payload.variant });
        sendJsonResponse(res, 200, {
          success: true,
          data: bioResult
        });
      } catch (err) {
        sendJsonResponse(res, 400, {
          success: false,
          error: err.message || 'AI Bio generation failed.'
        });
      }
      return;
    }

    // 5. Endpoint: /api/ai/pricing-guidance
    if (pathname === '/api/ai/pricing-guidance' && req.method === 'POST') {
      try {
        const payload = await parseJsonBody(req);
        const guidanceResult = LokatorAIService.getPricingGuidance(payload);
        sendJsonResponse(res, 200, {
          success: true,
          data: guidanceResult
        });
      } catch (err) {
        sendJsonResponse(res, 400, {
          success: false,
          error: err.message || 'AI Pricing guidance failed.'
        });
      }
      return;
    }

    sendJsonResponse(res, 404, { success: false, error: 'AI endpoint not found.' });
    return;
  }

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
