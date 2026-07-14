const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT_DIR = __dirname;
const PORT = Number(process.env.PORT || 8080);

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.htm': 'text/html; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

const COMPRESSIBLE = new Set(['.html', '.htm', '.css', '.js', '.json', '.svg', '.txt']);

const CACHE_TTL = {
  '.html': 'no-cache',
  '.htm':  'no-cache',
  '.css':  'no-cache',
  '.js':   'no-cache',
  '.png':  'public, max-age=2592000',
  '.jpg':  'public, max-age=2592000',
  '.jpeg': 'public, max-age=2592000',
  '.webp': 'public, max-age=2592000',
  '.gif':  'public, max-age=2592000',
  '.svg':  'public, max-age=2592000',
  '.mp4':  'public, max-age=2592000',
  '.pdf':  'public, max-age=2592000',
};

const sendFile = (req, res, filepath, statusCode = 200) => {
  const ext = path.extname(filepath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';
  const cache = CACHE_TTL[ext] || 'public, max-age=86400';

  const acceptEncoding = req.headers['accept-encoding'] || '';
  const useGzip = COMPRESSIBLE.has(ext) && /gzip/.test(acceptEncoding);

  const headers = {
    'Content-Type': type,
    'Cache-Control': cache,
    'Vary': 'Accept-Encoding',
  };
  if (useGzip) headers['Content-Encoding'] = 'gzip';

  const stream = fs.createReadStream(filepath);
  stream.on('open', () => {
    res.writeHead(statusCode, headers);
    if (useGzip) {
      stream.pipe(zlib.createGzip()).pipe(res);
    } else {
      stream.pipe(res);
    }
  });
  stream.on('error', () => {
    res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('Internal Server Error');
  });
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('Method Not Allowed');
    return;
  }

  const requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('Forbidden');
    return;
  }

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        sendFile(req, res, indexPath);
        return;
      }
    } else {
      sendFile(req, res, filePath);
      return;
    }
  } catch (error) {
    const notFoundPath = path.join(ROOT_DIR, '404.html');
    if (fs.existsSync(notFoundPath)) {
      sendFile(req, res, notFoundPath, 404);
      return;
    }
    res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`MENTALIA server listening on http://localhost:${PORT}`);
});
