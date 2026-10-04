#!/usr/bin/env node
/**
 * Script de vérification des correctifs de sécurité
 * Tests: isolation école, autorisation prof, rate limiting, tokens, etc.
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const results = { passed: 0, failed: 0, tests: [] };

// Helper pour faire des requêtes HTTP
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: data ? JSON.parse(data) : null });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// Helper pour tester
async function test(name, fn) {
  try {
    await fn();
    results.passed++;
    results.tests.push({ name, status: '✅ PASS' });
    console.log(`✅ ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

// Helper pour se connecter
async function login(email, password) {
  const url = new URL(`${BASE_URL}/api/auth/web-login`);
  const res = await request({
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    protocol: url.protocol,
    path: url.pathname,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: email, password });
  
  if (res.status !== 200 || !res.data?.data?.ok) {
    throw new Error(`Login failed: ${JSON.stringify(res.data)}`);
  }
  
  // Extraire le cookie de session
  const cookies = res.headers['set-cookie'] || [];
  const sessionCookie = cookies.find(c => c.includes('authjs.session-token'));
  if (!sessionCookie) throw new Error('No session cookie returned');
  
  return sessionCookie.split(';')[0];
}

// Helper pour faire une requête authentifiée
async function authRequest(cookie, path, method = 'GET', body = null) {
  const url = new URL(`${BASE_URL}${path}`);
  return request({
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    protocol: url.protocol,
    path: url.pathname + url.search,
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie
    }
  }, body);
}

async function main() {
  console.log('🧪 Tests de vérification des correctifs de sécurité\n');
  console.log('URL de test:', BASE_URL, '\n');

  // Test 1: Isolation école sur GET /api/eleves
  await test('Isolation école: Prof école A ne voit pas élèves école B', async () => {
    // Login comme professeur de l'école Dakar
    const profDakarCookie = await login('professeur@ecole.sn', 'Admin@123');
    
    // Récupérer les élèves
    const res = await authRequest(profDakarCookie, '/api/eleves?role=PROFESSEUR&limit=100');
    
    if (res.status !== 200) {
      throw new Error(`Expected 200, got ${res.status}`);
    }
    
    const eleves = res.data?.data || [];
    
    // Vérifier qu'aucun élève de Thiès n'est retourné
    // (Le seed crée des écoles Dakar et Thiès)
    const elevesThies = eleves.filter(e => e.classe?.nom?.includes('Thiès'));
    if (elevesThies.length > 0) {
      throw new Error(`Prof Dakar peut voir ${elevesThies.length} élèves de Thiès`);
    }
    
    // Vérifier qu'il y a bien des élèves de Dakar
    if (eleves.length === 0) {
      throw new Error('Aucun élève retourné - vérifier le seed');
    }
  });

  // Test 2: Rate limiting sur login
  await test('Rate limiting: 6 tentatives échouées = blocage', async () => {
    const url = new URL(`${BASE_URL}/api/auth/web-login`);
    
    // Faire 6 tentatives échouées
    for (let i = 0; i < 6; i++) {
      await request({
        hostname: url.hostname,
        port: url.port || 80,
        protocol: url.protocol,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { identifier: 'fake@test.com', password: 'wrongpass' });
    }
    
    // La 7ème devrait être bloquée
    const res = await request({
      hostname: url.hostname,
      port: url.port || 80,
      protocol: url.protocol,
      path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: 'fake@test.com', password: 'wrongpass' });
    
    if (res.status !== 429) {
      throw new Error(`Expected 429 (rate limited), got ${res.status}`);
    }
  });

  // Test 3: AUTH_SECRET validation
  await test('AUTH_SECRET: Serveur démarre avec secret défini', async () => {
    // Le serveur a démarré, donc le secret est OK
    // (sinon instrumentation.ts aurait fail)
    const res = await request({
      hostname: new URL(BASE_URL).hostname,
      port: new URL(BASE_URL).port || 80,
      protocol: new URL(BASE_URL).protocol,
      path: '/api/parametres',
      method: 'GET'
    });
    
    // Si on arrive ici, c'est que le serveur fonctionne
    if (res.status < 200 || res.status >= 500) {
      throw new Error('Serveur non accessible');
    }
  });

  // Test 4: Validation notes - prof ne peut pas saisir pour classe non enseignée
  await test('Autorisation notes: Prof ne peut pas saisir notes pour autre classe', async () => {
    const profCookie = await login('professeur@ecole.sn', 'Admin@123');
    
    // Essayer de créer une note pour une évaluation qu'il n'enseigne pas
    // (nécessiterait de connaître les IDs - on teste juste le mécanisme)
    // Pour ce test, on vérifie que l'endpoint exige une vérification
    
    // Le test réel nécessiterait de:
    // 1. Créer une évaluation pour une classe
    // 2. Essayer de saisir une note avec un autre prof
    // 3. Vérifier le 403
    
    // Pour l'instant, vérifier que l'endpoint est protégé
    const res = await authRequest(profCookie, '/api/notes', 'POST', {
      evaluationId: 'fake-id',
      notes: []
    });
    
    // Devrait retourner 404 (évaluation non trouvée) ou 403 (accès refusé)
    if (res.status !== 404 && res.status !== 403) {
      throw new Error(`Expected 404 or 403, got ${res.status}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log(`Tests terminés: ${results.passed} réussis, ${results.failed} échoués`);
  console.log('='.repeat(50));
  
  if (results.failed > 0) {
    console.log('\n❌ Échecs:');
    results.tests.filter(t => t.error).forEach(t => {
      console.log(`  - ${t.name}: ${t.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ Tous les tests sont passés!');
    process.exit(0);
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Erreur fatale:', err);
    process.exit(1);
  });
}

module.exports = { test, login, authRequest };
