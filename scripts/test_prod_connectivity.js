const https = require('https');

https.get('https://padifix.vercel.app', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`BODY LENGTH: ${data.length}`);
    console.log(`TITLE EXTRACT: ${data.match(/<title>([^<]+)<\/title>/i)?.[1]}`);
  });
}).on('error', (e) => {
  console.error(`ERROR: ${e.message}`);
});
