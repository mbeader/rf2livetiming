const fs   = require('fs');
const config = require('../config');
const io = require('socket.io-client');
const url = 'http://localhost:' + config.HTTP_LISTEN_PORT;
socket = io(url, { timeout: 2000 });
var flag = false;

socket.on('connect', function() {
  socket.emit('kill');
  flag = true;
});

socket.on('connect_error', function() {
  if(flag)
    console.log('Successfully stopped');
  else
    console.log('Failed to connect to ' + url);
  process.exit(0);
});

socket.on('connect_timeout', function() {
  if(flag)
    console.log('Successfully stopped');
  else
    console.log('Failed to connect to ' + url);
  process.exit(0);
});
