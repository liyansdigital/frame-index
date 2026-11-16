// Local chaining proxy for the browser test suite.
//
// Why this exists: some sandboxes route all egress through an authenticated
// HTTP proxy named by the https_proxy environment variable. Chromium cannot
// answer that proxy's Basic-auth challenge from the environment, so media
// requests fail with ERR_TUNNEL_CONNECTION_FAILED. This helper listens on
// 127.0.0.1:8899 without auth, connects local targets directly, and tunnels
// remote HTTPS through the upstream proxy, reading the credentials from the
// environment at runtime. No credential is stored in this file or anywhere in
// the repository. When no upstream proxy is configured it simply proxies
// directly. playwright.config.ts starts it only when https_proxy is set.
import http from 'node:http';
import net from 'node:net';

const PORT = 8899;
const upstreamRaw = process.env.https_proxy || process.env.HTTPS_PROXY || '';
const upstream = upstreamRaw ? new URL(upstreamRaw) : null;
const auth = upstream?.username
  ? 'Basic ' +
    Buffer.from(`${decodeURIComponent(upstream.username)}:${decodeURIComponent(upstream.password)}`).toString('base64')
  : null;

const isLocal = (h) => h === '127.0.0.1' || h === 'localhost' || h === '::1' || h === '[::1]';

const server = http.createServer((req, res) => {
  res.on('error', () => undefined); // a browser going away mid-response is not a proxy failure
  // Health check used by Playwright's webServer readiness probe.
  if (!req.url?.startsWith('http')) {
    res.writeHead(200, { 'content-type': 'text/plain' });
    res.end('local-proxy ok');
    return;
  }
  let target;
  try {
    target = new URL(req.url);
  } catch {
    res.writeHead(400);
    res.end();
    return;
  }
  if (isLocal(target.hostname) || !upstream) {
    const r = http.request(
      { host: target.hostname, port: target.port || 80, path: target.pathname + target.search, method: req.method, headers: req.headers },
      (u) => {
        res.writeHead(u.statusCode || 502, u.headers);
        u.pipe(res);
      }
    );
    r.on('error', () => {
      if (!res.headersSent) res.writeHead(502);
      res.end();
    });
    req.pipe(r);
    return;
  }
  const headers = { ...req.headers };
  if (auth) headers['Proxy-Authorization'] = auth;
  const r = http.request(
    { host: upstream.hostname, port: Number(upstream.port || 80), path: req.url, method: req.method, headers },
    (u) => {
      res.writeHead(u.statusCode || 502, u.headers);
      u.pipe(res);
    }
  );
  r.on('error', () => {
    if (!res.headersSent) res.writeHead(502);
    res.end();
  });
  req.pipe(r);
});

server.on('connect', (req, clientSocket, head) => {
  const [host, portRaw] = (req.url || '').split(':');
  const port = Number(portRaw || 443);
  const finish = (upstreamSocket) => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    if (head?.length) upstreamSocket.write(head);
    upstreamSocket.pipe(clientSocket);
    clientSocket.pipe(upstreamSocket);
  };
  if (isLocal(host) || !upstream) {
    const s = net.connect(port, host, () => finish(s));
    s.on('error', () => clientSocket.destroy());
    return;
  }
  const s = net.connect(Number(upstream.port || 80), upstream.hostname, () => {
    let reqLine = `CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n`;
    if (auth) reqLine += `Proxy-Authorization: ${auth}\r\n`;
    reqLine += '\r\n';
    s.write(reqLine);
    let buf = Buffer.alloc(0);
    const onData = (chunk) => {
      buf = Buffer.concat([buf, chunk]);
      const idx = buf.indexOf('\r\n\r\n');
      if (idx === -1) return;
      s.off('data', onData);
      const statusLine = buf.subarray(0, idx).toString('latin1').split('\r\n')[0];
      if (!/ 200 /.test(statusLine + ' ')) {
        clientSocket.destroy();
        s.destroy();
        return;
      }
      const rest = buf.subarray(idx + 4);
      if (rest.length) clientSocket.write(rest);
      finish(s);
    };
    s.on('data', onData);
  });
  s.on('error', () => clientSocket.destroy());
});

process.on('uncaughtException', (e) => console.error('[local-proxy]', e.message));

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Local chaining proxy at http://127.0.0.1:${PORT}/ (upstream: ${upstream ? upstream.host : 'direct'})`);
});
