const http = require('http');

function request(method, path, data = null, cookie = null, csrf = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (cookie) {
      options.headers['Cookie'] = cookie;
    }
    if (csrf) {
      options.headers['x-csrf-token'] = csrf;
    }
    
    if (data) {
      const payload = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let setCookie = res.headers['set-cookie'] || [];
        resolve({
          status: res.statusCode,
          body: body ? JSON.parse(body) : null,
          cookie: setCookie.join('; '),
          rawHeaders: res.headers
        });
      });
    });
    
    req.on('error', e => reject(e));
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  const username = 'testuser_' + Date.now();
  
  console.log("0. Fetching CSRF token...");
  const csrfRes = await request('GET', '/api/csrf-token');
  const csrfToken = csrfRes.body.csrfToken;
  let sessionCookie = csrfRes.cookie;
  console.log("CSRF Token:", csrfToken);

  console.log("\n1. Testing Registration...");
  const regRes = await request('POST', '/api/register', {
    email: `${username}@test.com`,
    password: 'Password123!',
    username: username,
    firstName: 'Test',
    lastName: 'User'
  }, sessionCookie, csrfToken);
  console.log("Register Response:", regRes.status, regRes.body);
  if (regRes.cookie) sessionCookie = regRes.cookie;
  
  console.log("\n2. Testing Login...");
  const loginRes = await request('POST', '/api/login', {
    email: `${username}@test.com`,
    password: 'Password123!'
  }, sessionCookie, csrfToken);
  console.log("Login Response:", loginRes.status, loginRes.body);
  if (loginRes.cookie) sessionCookie = loginRes.cookie;
  
  console.log("\n3. Testing Post Creation (JSON arrays test)...");
  const postRes = await request('POST', '/api/posts', {
    title: "Test Post JSON",
    content: "Looking for teammates",
    skillsOffered: ["JavaScript", "Python"],
    skillsWanted: ["TypeScript", "React"],
    requiredSkills: ["Git"],
    allowedDepartments: ["CS"]
  }, sessionCookie, csrfToken);
  console.log("Post Create Response:", postRes.status, postRes.body);
  
  console.log("\n4. Validating JSON Response Structure...");
  if (postRes.body && Array.isArray(postRes.body.skillsOffered)) {
    console.log("✅ SUCCESS: skillsOffered is an Array!", postRes.body.skillsOffered);
  } else {
    console.log("❌ FAILED: skillsOffered is stringified:", typeof postRes.body?.skillsOffered, postRes.body?.skillsOffered);
  }
  
  console.log("\n5. Fetching Posts...");
  const getPostsRes = await request('GET', '/api/posts', null, sessionCookie, csrfToken);
  console.log("Get Posts Response:", getPostsRes.status, getPostsRes.body?.length ? `Found ${getPostsRes.body.length} posts` : getPostsRes.body);
  if (getPostsRes.body && getPostsRes.body.length > 0) {
     const p = getPostsRes.body[0];
     console.log("First post skillsWanted type:", typeof p.skillsWanted, p.skillsWanted);
  }
}

runTests().catch(console.error);
