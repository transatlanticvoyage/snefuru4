// Simple test server to isolate the issue
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Test server is working!');
});

server.listen(3000, 'localhost', () => {
  console.log('Test server running on http://localhost:3000');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});