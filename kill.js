const fs   = require('fs');

/*fs.readFile('pid.json', (err, data) => {
  if (err) throw err;
  //process.kill(JSON.parse(data), 'SIGTERM');
  process.emit('test');
  process.exit();
});*/

const config = require('./config');
const io = require('socket.io-client');
const url = 'http://localhost:' + config.HTTP_LISTEN_PORT;
//const socketClient = io.connect('http://localhost:' + config.HTTP_LISTEN_PORT);
socket = io(url, { timeout: 2000 });

socket.on('connect', function() {
  socket.emit('kill');
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

socket.on('connect_error', function() {
  console.log('Failed to connect to ' + url);
  process.exit(0);
});

socket.on('connect_timeout', function() {
  console.log('Failed to connect to ' + url);
  process.exit(0);
});
