// login.test.js
const autocannon = require('autocannon');

autocannon({
  url: 'http://localhost:5000/api/v1/auth/login',
  method: 'POST',
  connections: 50,
  duration: 15,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'newperson121@gmail.com',
    password: 'newperson121'
  })
}, console.log);
