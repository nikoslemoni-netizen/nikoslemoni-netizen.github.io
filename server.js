const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const PORT = Number(process.env.PORT || 8080);
const RECAPTCHA_TEST_SECRET_KEY = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

const parseEnvFile = (filepath)=>{
  if (!fs.existsSync(filepath)) return;
  const lines = fs.readFileSync(filepath, 'utf8').split(/\r?\n/);
  lines.forEach((line)=>{
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

parseEnvFile(path.join(ROOT_DIR, '.env'));

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

const sendJson = (res, statusCode, payload)=>{
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
};

const sendFile = (res, filepath, statusCode = 200)=>{
  const ext = path.extname(filepath).toLowerCase();
  const type = MIME_TYPES[ext] || 'application/octet-stream';
  const stream = fs.createReadStream(filepath);
  stream.on('open', ()=>{
    res.writeHead(statusCode, {'Content-Type': type});
    stream.pipe(res);
  });
  stream.on('error', ()=>{
    res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('Internal Server Error');
  });
};

const readRequestBody = (req)=> new Promise((resolve, reject)=>{
  let body = '';
  req.on('data', (chunk)=>{
    body += chunk;
    if (body.length > 1e6) {
      reject(new Error('Request body too large'));
      req.destroy();
    }
  });
  req.on('end', ()=> resolve(body));
  req.on('error', reject);
});

const isLocalRequestHost = (host)=>{
  if (!host) return false;
  const hostname = host.split(':')[0].trim().toLowerCase();
  return hostname === 'localhost' || hostname === '127.0.0.1';
};

const verifyRecaptchaToken = async (token, remoteIp, host)=>{
  const secret = isLocalRequestHost(host)
    ? RECAPTCHA_TEST_SECRET_KEY
    : process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return {status: 500, payload: {success: false, error: 'missing_secret'}};
  }

  const params = new URLSearchParams({
    secret,
    response: token
  });
  if (remoteIp) {
    params.set('remoteip', remoteIp);
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: params.toString()
  });

  if (!response.ok) {
    return {status: 502, payload: {success: false, error: 'verification_failed'}};
  }

  const data = await response.json();
  if (!data.success) {
    return {
      status: 400,
      payload: {
        success: false,
        error: 'invalid_captcha',
        codes: Array.isArray(data['error-codes']) ? data['error-codes'] : []
      }
    };
  }

  return {status: 200, payload: {success: true}};
};

const server = http.createServer(async (req, res)=>{
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'POST' && url.pathname === '/api/verify-recaptcha') {
    try {
      const rawBody = await readRequestBody(req);
      const body = rawBody ? JSON.parse(rawBody) : {};
      const token = typeof body.token === 'string' ? body.token.trim() : '';
      if (!token) {
        sendJson(res, 400, {success: false, error: 'missing_token'});
        return;
      }

      const forwardedFor = req.headers['x-forwarded-for'];
      const remoteIp = typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : req.socket.remoteAddress || '';

      const result = await verifyRecaptchaToken(token, remoteIp, req.headers.host || '');
      sendJson(res, result.status, result.payload);
      return;
    } catch (error) {
      sendJson(res, 500, {success: false, error: 'server_error'});
      return;
    }
  }

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
        sendFile(res, indexPath);
        return;
      }
    } else {
      sendFile(res, filePath);
      return;
    }
  } catch (error) {
    const notFoundPath = path.join(ROOT_DIR, '404.html');
    if (fs.existsSync(notFoundPath)) {
      sendFile(res, notFoundPath, 404);
      return;
    }
    res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('Not Found');
  }
});

server.listen(PORT, ()=>{
  console.log(`MENTALIA server listening on http://localhost:${PORT}`);
});
