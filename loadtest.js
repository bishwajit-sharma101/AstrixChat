const autocannon = require('autocannon');

function runTest(connections) {
  console.log(`\n🚀 Running test with ${connections} connections\n`);

  autocannon({
    url: 'http://localhost:5000/api/v1/auth/login',
    method: 'POST',
    connections,
    duration: 10,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'newperson121@gmail.com',
      password: 'newperson121'
    })
  }, (err, res) => {
    if (err) {
      console.error("Test error:", err);
    } else {
      console.log(`\n=== RESULTS FOR ${connections} CONNECTIONS ===\n`);
      console.log(`Success 2xx: ${res['2xx']}`);
      console.log(`Non-2xx: ${res.non2xx}`);
      console.log(`Errors: ${res.errors}`);
      console.log(`Timeouts: ${res.timeouts}`);
      console.log(`Req/sec: ${res.requests.average}`);
      console.log(`Avg Latency: ${res.latency.average} ms`);
      console.log("\nFull stats below:");
      console.log(res);
    }
  });
}

runTest(50);   // Test with 50 concurrent users
setTimeout(() => runTest(100), 20000);  // Test with 100 users after previous test finishes
