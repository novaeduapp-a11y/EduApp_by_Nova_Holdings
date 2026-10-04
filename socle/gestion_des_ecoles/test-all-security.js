#!/usr/bin/env node
const http = require('http');
const BASE_URL = 'http://localhost:3000';
let passed = 0, failed = 0;

function req(options, body = null) {
  return new Promise((resolve, reject) => {
    const r = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ s: res.statusCode, h: res.headers, d: d ? JSON.parse(d) : null }); }
        catch { resolve({ s: res.statusCode, h: res.headers, d }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(typeof body === 'string' ? body : JSON.stringify(body));
    r.end();
  });
}

async function test(name, fn) {
  try { await fn(); console.log(`✅ ${name}`); passed++; return true; }
  catch (e) { console.log(`❌ ${name}: ${e.message}`); failed++; return false; }
}

(async () => {
  console.log('🧪 Tests de sécurité complets\n');
  
  // Test: Token mobile + révocation
  await test('Token mobile: Login + Révocation', async () => {
    const r1 = await req({ hostname: 'localhost', port: 3000, path: '/api/mobile/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { identifier: 'parent@ecole.sn', password: 'Admin@123' });
    const token = r1.d?.data?.token;
    if (!token) throw new Error('No token');
    
    const r2 = await req({ hostname: 'localhost', port: 3000, path: '/api/auth/revoke-tokens', method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    if (r2.s !== 200) throw new Error('Revoke failed');
    
    const r3 = await req({ hostname: 'localhost', port: 3000, path: '/api/parent/enfants', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } });
    if (r3.s !== 401) throw new Error(`Token not revoked, got ${r3.s}`);
  });
  
  console.log(`\n${'='.repeat(50)}\nRésultat: ${passed} réussis, ${failed} échoués\n${'='.repeat(50)}`);
  process.exit(failed > 0 ? 1 : 0);
})();
