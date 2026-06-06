// Simple static file server for development testing
import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const PORT = process.env.PORT || 8080;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff2': 'font/woff2',
    '.scss': 'text/plain'
};

const server = createServer(async (req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/index.html';

    const safe = normalize(urlPath).replace(/^(\.\.[\/\\])+/, '');
    const filePath = join(ROOT, safe);

    try {
        const s = await stat(filePath);
        if (s.isDirectory()) {
            res.writeHead(301, { Location: safe + '/' });
            return res.end();
        }
        const data = await readFile(filePath);
        const ext = extname(filePath).toLowerCase();
        res.writeHead(200, {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    } catch (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + safe);
    }
});

server.listen(PORT, () => {
    console.log(`UXKD dev server running at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});
