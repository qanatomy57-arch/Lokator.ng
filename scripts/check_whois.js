const net = require('net');

const client = new net.Socket();
client.connect(43, 'whois.nic.net.ng', () => {
  client.write('padifix.ng\r\n');
});

client.on('data', (data) => {
  console.log(data.toString());
});

client.on('close', () => {
  process.exit(0);
});

client.on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
