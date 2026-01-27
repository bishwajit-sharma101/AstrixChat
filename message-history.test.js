const autocannon = require("autocannon");

// CHANGE THESE IDs (must exist in DB)
const USER_ID = "691f272aa9f318519ba5b218";   // :userId (chat partner)
const MY_ID   = "691f26e1a9f318519ba5b212";   // ?myId (logged-in user)

autocannon(
  {
    url: `http://localhost:5000/api/v1/chat/messages/history/${USER_ID}?myId=${MY_ID}`,
    method: "GET",
    connections: 50,      // start safe
    duration: 15,         // seconds
    pipelining: 1,
  },
  (err, result) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log("\n=== CHAT HISTORY LOAD TEST RESULTS ===\n");
    console.log("2xx:", result["2xx"]);
    console.log("Non-2xx:", result.non2xx);
    console.log("Errors:", result.errors);
    console.log("Timeouts:", result.timeouts);
    console.log("Req/sec:", result.requests.average);
    console.log("Avg Latency:", result.latency.average, "ms");
    console.log("p95:", result.latency.p95, "ms");
    console.log("p99:", result.latency.p99, "ms");
  }
);
