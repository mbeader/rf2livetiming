const http = require('http');
var server = http.createServer(handler);
var io = require('socket.io')(server);
const dgram = require('dgram');
const fs   = require('fs');
const path = require('path');
const url  = require('url');
const config = require('./config');
const rfactor = require('./rfactor');
const hotlaps = require('./hotlaps');

var state = new Object();
state.track = '';
state.session = '';

server.listen(config.HTTP_LISTEN_PORT);
console.log('HTTP listening on ' + config.HTTP_LISTEN_PORT);

function handler (req, res) {
  var uri = url.parse(req.url);
  
  switch(uri.pathname) {
    case '/':
    case '/index.html':
      fs.readFile('index.html', function(error, content) {
        res.writeHead(200, {'Content-type': 'text/html'});
        res.end(content, 'utf-8');
      });
      break;
    case '/init':
      res.writeHead(200, {'Content-type': 'application/json'});
      let content = new Object();
      content.banner = config.PAGE_BANNER;
      content.title = config.PAGE_TITLE;
      content.message = config.PAGE_MESSAGE;
      content.link = config.JOIN_LINK;
      if(state.track == '') {
        let temp = new Object();
        temp.track = hotlaps.getTrack();
        temp.session = '';
        content.info = temp;
      } else
        content.info = state;
      content.data = hotlaps.getData();
      res.end(JSON.stringify(content), 'utf-8');
      break;
    case '/client.js':
      fs.readFile('client.js', function(error, content) {
        res.writeHead(200, {'Content-type': 'application/javascript'});
        res.end(content, 'utf-8');
      });
    break;
    case '/style.css':
      fs.readFile('style.css', function(error, content) {
        res.writeHead(200, {'Content-type': 'text/css'});
        res.end(content, 'utf-8');
      });
      break;
    case '/' + config.PAGE_BANNER:
      fs.readFile(config.PAGE_BANNER, function(error, content) {
        res.writeHead(200, {'Content-type': 'image/jpg'});
        res.end(content, 'utf-8');
      });
      break;
  }
}

io.on('connection', function (socket) {
  if(socket.handshake.address == config.IPV4_LOOPBACK || socket.handshake.address == '::ffff:' + config.IPV4_LOOPBACK || socket.handshake.address == '::1') {
    socket.on('kill', function () {
      console.log('Terminating');
      process.exit(0);
    });
  }
});

const userver = dgram.createSocket('udp4');

userver.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  userver.close();
});

userver.on('message', (msg, rinfo) => {
  //console.log(rinfo.address + ':' + rinfo.port);
  let packet = rfactor.parseUDPPacket(msg);
  if(packet.trackname != state.track || packet.sessionname != state.session) {
    state.track = packet.trackname;
    state.session = packet.sessionname;
    io.emit('session', state);
  }
  let drivers = rfactor.getDriversMap(packet.veh);
  let result = rfactor.parseResultStream(packet.results);
  if(typeof result === "undefined")
    console.log('udef');
  if(typeof result[0] === "undefined")
    ;
  else {
    let updates = hotlaps.onUpdate(packet.trackname, packet.sessionname, drivers, result);
    if(typeof updates !== "undefined") {
      io.emit('hotlap', updates);
    }
  }
});

userver.on('listening', () => {
  const address = userver.address();
  console.log('RF2  listening on ' + config.RF2_LISTEN_PORT);
});

userver.bind(config.RF2_LISTEN_PORT);
