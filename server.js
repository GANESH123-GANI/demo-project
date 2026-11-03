import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApiRequest } from './src/routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, 'public');

const PORT = process.env.PORT || 3000;

// MIME types for static assets
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer(async (req, res) => {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. API Route Handling (with internal Vercel service binding support)
  if (pathname.startsWith('/api/')) {
    const backendServiceUrl = process.env.BACKEND_SERVICE_URL || process.env.BACKEND_URL;
    if (backendServiceUrl) {
      try {
        const targetUrl = new URL(pathname + (parsedUrl.search || ''), backendServiceUrl);
        const headers = { ...req.headers, host: targetUrl.host };
        delete headers['content-length'];

        let bodyBuffer = null;
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          const buffers = [];
          for await (const chunk of req) {
            buffers.push(chunk);
          }
          bodyBuffer = Buffer.concat(buffers);
        }

        const proxyRes = await fetch(targetUrl.toString(), {
          method: req.method,
          headers: {
            'Content-Type': req.headers['content-type'] || 'application/json',
            ...(req.headers['authorization'] ? { 'Authorization': req.headers['authorization'] } : {})
          },
          body: bodyBuffer && bodyBuffer.length > 0 ? bodyBuffer : undefined
        });

        res.statusCode = proxyRes.status;
        proxyRes.headers.forEach((val, key) => {
          res.setHeader(key, val);
        });
        const resData = await proxyRes.arrayBuffer();
        return res.end(Buffer.from(resData));
      } catch (proxyErr) {
        console.error(`[Proxy] Error forwarding to backend service (${backendServiceUrl}):`, proxyErr.message);
        // Fall through to local handler as resilience fallback
      }
    }

    let body = {};
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const rawBody = Buffer.concat(buffers).toString('utf-8');
        if (rawBody.trim()) {
          body = JSON.parse(rawBody);
        }
      } catch (err) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Malformed JSON payload' }));
      }
    }

    const query = Object.fromEntries(parsedUrl.searchParams.entries());
    return handleApiRequest(req, res, pathname, query, body);
  }

  // 2. Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Prevent directory traversal attacks
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 403;
    return res.end('Access denied');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA client-side routing
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexPath, (readErr, content) => {
        if (readErr) {
          res.statusCode = 404;
          return res.end('Not found');
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=UTF-8');
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(` ProcureFlow Enterprise S2P Platform Server Started`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Mode: Enterprise God Mode (Active)`);
    console.log(` Workspaces: 7 Workspaces / 13 Modules Ready`);
    console.log(`========================================================`);
  });
}

export { server };

