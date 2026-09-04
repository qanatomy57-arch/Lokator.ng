const https = require('https');

function testUrl(url) {
  const start = Date.now();
  https.get(url, res => {
    console.log(`${url} -> ${res.statusCode} in ${Date.now() - start}ms`);
  }).on('error', e => {
    console.error(`${url} -> ERROR: ${e.message}`);
  });
}

testUrl('https://padifix.vercel.app/');
testUrl('https://padifix.vercel.app/index.html');
testUrl('https://padifix.vercel.app/search.html');
testUrl('https://padifix.vercel.app/profile.html?id=1');
testUrl('https://padifix.vercel.app/register.html');
