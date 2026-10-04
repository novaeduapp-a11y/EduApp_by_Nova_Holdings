const http = require('http');
async function req(opts, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, d: d ? JSON.parse(d) : d }); }
        catch { resolve({ s: res.statusCode, d }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

(async () => {
  console.log('Test debug token...');
  const r1 = await req({ hostname: 'localhost', port: 3000, path: '/api/mobile/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { identifier: 'parent@ecole.sn', password: 'Admin@123' });
  console.log('Login:', r1.s, r1.d);
  
  const token = r1.d?.data?.token;
  console.log('Token:', token?.substring(0, 50) + '...');
  
  const r2 = await req({ hostname: 'localhost', port: 3000, path: '/api/auth/revoke-tokens', method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  console.log('Revoke:', r2.s, r2.d);
  
  const r3 = await req({ hostname: 'localhost', port: 3000, path: '/api/parent/enfants', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
  console.log('After revoke:', r3.s, typeof r3.d === 'object' ? JSON.stringify(r3.d).substring(0, 100) : r3.d);
})();
