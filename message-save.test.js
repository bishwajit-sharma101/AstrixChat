// message-save.test.js
const autocannon = require('autocannon');

autocannon({
  url: 'http://localhost:5000/api/v1/chat/messages/save',
  method: 'POST',
  connections: 100,
  duration: 15,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: "691f26e1a9f318519ba5b212",
    to: "691f272aa9f318519ba5b218",
    message: "Load test message"
  })
}, console.log);
