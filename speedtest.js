const autocannon = require('autocannon');

function runTest(connections) {
  console.log(`\n🚀 Running speed test with ${connections} connections\n`);

  autocannon({
    url: 'http://localhost:5000/speed',
    method: 'GET',
    connections,   // number of concurrent connections
    duration: 10,  // seconds
  }, (err, results) => {
    if (err) console.error(err);

    console.log(`\n=== RESULTS FOR ${connections} CONNECTIONS ===\n`);
    console.log("Req/sec:", results.requests.average);
    console.log("Avg Latency:", results.latency.average, "ms");
    console.log("Errors:", results.errors);
    console.log("Timeouts:", results.timeouts);
    console.log("\nFull stats below:");
    console.log(results);
  });
}

(async () => {
  await runTest(50);
  await runTest(200);
  await runTest(500);
})();
