
const ENDPOINTS = [
  '/api/health',
  '/api/posts',
  '/api/users/profile',
  '/api/events',
  '/api/chats'
];
const RUNS = 100;
const BASE_URL = 'http://localhost:5000';

async function fetchWithTime(url: string, cookie?: string): Promise<number> {
  const start = performance.now();
  await fetch(url, { headers: cookie ? { 'Cookie': cookie } : {} });
  return performance.now() - start;
}

function calculatePercentiles(times: number[]) {
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  return { p50, p95 };
}

async function run() {
  console.log(`Starting latency test: ${RUNS} runs per endpoint...`);
  
  // Create a mock user session for testing protected routes
  const loginRes = await fetch(`${BASE_URL}/api/auth/mock`, { method: 'POST' });
  const setCookie = loginRes.headers.get('set-cookie');
  const cookie = setCookie ? setCookie.split(';')[0] : '';
  
  for (const endpoint of ENDPOINTS) {
    const times: number[] = [];
    process.stdout.write(`Testing ${endpoint}... `);
    
    // 5 warmup requests
    for (let i = 0; i < 5; i++) {
      await fetchWithTime(`${BASE_URL}${endpoint}`, cookie);
    }
    
    // Actual test
    for (let i = 0; i < RUNS; i++) {
      times.push(await fetchWithTime(`${BASE_URL}${endpoint}`, cookie));
    }
    
    const { p50, p95 } = calculatePercentiles(times);
    console.log(`p50: ${p50.toFixed(2)}ms | p95: ${p95.toFixed(2)}ms`);
  }
}

run().catch(console.error);
