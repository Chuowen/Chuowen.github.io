import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const root = resolve('.');
const port = 8000;
const mime_types = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
};

function sendFile(request, response, file_path, size) {
  const content_type = mime_types[extname(file_path).toLowerCase()] || 'application/octet-stream';
  const range = request.headers.range;
  const shared_headers = { 'Accept-Ranges': 'bytes', 'Content-Type': content_type };

  if (!range) {
    response.writeHead(200, { ...shared_headers, 'Content-Length': size });
    createReadStream(file_path).pipe(response);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    response.writeHead(416, { 'Content-Range': `bytes */${size}` });
    response.end();
    return;
  }

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (start > end || start >= size) {
    response.writeHead(416, { 'Content-Range': `bytes */${size}` });
    response.end();
    return;
  }

  response.writeHead(206, {
    ...shared_headers,
    'Content-Length': end - start + 1,
    'Content-Range': `bytes ${start}-${end}/${size}`,
  });
  createReadStream(file_path, { start, end }).pipe(response);
}

createServer((request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const relative_path = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file_path = resolve(root, `.${relative_path}`);
    const is_inside_root = file_path === root || file_path.startsWith(`${root}${sep}`);
    if (!is_inside_root) throw new Error('Forbidden');

    const stats = statSync(file_path);
    if (!stats.isFile()) throw new Error('Not found');
    sendFile(request, response, file_path, stats.size);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Portfolio available at http://localhost:${port}`);
});
