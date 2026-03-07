const http = require('http');

const data = JSON.stringify({
    token: 'debug_test_token'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/google',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        console.log('BODY START:', body.substring(0, 50));
        console.log('IS JSON?', body.startsWith('{'));
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
