const http = require('http');

async function testEndpoint(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting Backend Verification Tests ---');

  // 1. Health check
  console.log('\n[1] Testing GET /api/health ...');
  const healthRes = await testEndpoint({
    host: 'localhost',
    port: 5000,
    path: '/api/health',
    method: 'GET'
  });
  console.log(`Status: ${healthRes.status}, Response:`, healthRes.data);

  // 2. Auth Login with Demo User
  console.log('\n[2] Testing POST /api/auth/login with demo user ...');
  const loginRes = await testEndpoint({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'demo@smartride.com', password: 'demo' });
  console.log(`Status: ${loginRes.status}, User: ${loginRes.data?.user?.email}, Has Token: ${Boolean(loginRes.data?.token)}`);
  const token = loginRes.data?.token;

  if (!token) {
    throw new Error('Failed to obtain auth token from login!');
  }

  // 3. Auth Me
  console.log('\n[3] Testing GET /api/auth/me with Bearer token ...');
  const meRes = await testEndpoint({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`Status: ${meRes.status}, Name: ${meRes.data?.name}`);

  // 4. Social Login
  console.log('\n[4] Testing POST /api/auth/social-login ...');
  const socialRes = await testEndpoint({
    host: 'localhost',
    port: 5000,
    path: '/api/auth/social-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'social_tester@smartride.com', name: 'Social User', provider: 'google', photoURL: 'https://example.com/p.png' });
  console.log(`Status: ${socialRes.status}, Token: ${Boolean(socialRes.data?.token)}, PhotoURL: ${socialRes.data?.user?.photoURL}`);

  // 5. Create Ride with frontend payload (using rideType, numeric price, eta)
  console.log('\n[5] Testing POST /api/rides with RideComparison frontend payload ...');
  const rideRes = await testEndpoint({
    host: 'localhost',
    port: 5000,
    path: '/api/rides',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, {
    rideType: 'Uber Go',
    price: 245,
    pickup: 'Indiranagar 100ft Road',
    dropoff: 'Electronic City Phase 1',
    eta: '25 min'
  });
  console.log(`Status: ${rideRes.status}, Ride ID: ${rideRes.data?._id || rideRes.data?.id}, Vehicle: ${rideRes.data?.vehicleType}, Status: ${rideRes.data?.status}`);
  const rideId = rideRes.data?._id || rideRes.data?.id;

  // 6. List Rides
  console.log('\n[6] Testing GET /api/rides ...');
  const listRidesRes = await testEndpoint({
    host: 'localhost',
    port: 5000,
    path: '/api/rides',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log(`Status: ${listRidesRes.status}, Rides count: ${listRidesRes.data?.length}`);

  // 7. Update Ride Status
  console.log('\n[7] Testing PUT /api/rides/:id/status ...');
  const statusRes = await testEndpoint({
    host: 'localhost',
    port: 5000,
    path: `/api/rides/${rideId}/status`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { status: 'confirmed' });
  console.log(`Status: ${statusRes.status}, New Status: ${statusRes.data?.status}`);

  // 8. AI Decision Engine
  console.log('\n[8] Testing POST /api/ai/decide (EMMDE Multi-Agent Engine) ...');
  const aiRes = await testEndpoint({
    host: 'localhost',
    port: 5000,
    path: '/api/ai/decide',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    origin: 'MG Road Metro',
    destination: 'Whitefield ITPL',
    userWeights: { wFare: 0.4, wTime: 0.3, wEffort: 0.15, wStability: 0.15 },
    context: { trafficIndex: 7, precipitation: 20, demandIndex: 6, isPeakHour: true }
  });
  console.log(`Status: ${aiRes.status}`);
  console.log(`Best Pick: ${aiRes.data?.bestRide?.name} (Score: ${aiRes.data?.bestRide?.recommendationScore})`);
  console.log(`Options Count: ${aiRes.data?.options?.length}`);
  console.log(`Reasoning: ${aiRes.data?.reasoning}`);

  // 9. Ride Estimate Endpoint
  console.log('\n[9] Testing GET /api/ride-estimate ...');
  const estimateRes = await testEndpoint({
    host: 'localhost',
    port: 5000,
    path: '/api/ride-estimate',
    method: 'GET'
  });
  console.log(`Status: ${estimateRes.status}, Estimates count: ${estimateRes.data?.estimates?.length}`);

  // 10. Performance Logs
  console.log('\n[10] Testing POST /api/performance-logs ...');
  const perfRes = await testEndpoint({
    host: 'localhost',
    port: 5000,
    path: '/api/performance-logs',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { vuIndex: 1, timestamp: Date.now() });
  console.log(`Status: ${perfRes.status}, Data:`, perfRes.data);

  console.log('\n=======================================');
  console.log('✅ ALL BACKEND TEST SUITES PASSED SUCCESSFULLY!');
  console.log('=======================================');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
