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
const mapbuilder = require('./mapbuilder');
const classcolors = require('./classes');

var state = new Object();
state.track = '';
state.session = '';
state.currtime = 0;
state.endtime = null;
state.maxlaps =  null;
state.drivers;
state.phase = new Object();
state.phase.name = '';
state.phase.yellow = '';
state.phase.sectors = [0,0,0];
var timer;
var mapnamespace = io.of('/map');
var exists = false;

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
      content.title = config.BASE_TITLE;
      content.heading = config.PAGE_HEADING;
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
    case '/map':
      res.writeHead(200, {'Content-type': 'text/html'});
      let cntnt = '<html><head><script type ="application/javascript" src="/socket.io/socket.io.js"></script><script type ="application/javascript" src="map.js"></script></head><body><canvas id="map" width="1000" height="1000"></canvas></body></html>'
      res.end(cntnt, 'utf-8');
    case '/client.js':
    case '/map.js':
      fs.readFile(path.join('.', uri.pathname), function(error, content) {
        res.writeHead(200, {'Content-type': 'application/javascript'});
        res.end(content, 'utf-8');
      });
    break;
    case '/TomorrowNight.css':
    case '/FourLeaves.css':
      fs.readFile(path.join('css', uri.pathname), function(error, content) {
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
    default:
      res.writeHead(404, {'Content-type': 'text/html'});
      res.end('404 File not found', 'utf-8');
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

mapnamespace.on('connection', function (socket) {
  mapnamespace.emit('classes', classcolors);
  if(exists)
    mapnamespace.emit('map', mapbuilder.getTrackMap());
});

const userver = dgram.createSocket('udp4');

userver.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  userver.close();
});

userver.on('message', (msg, rinfo) => {
  if(rinfo.address != config.RF2_SRC_ADDR)
    return;
  if(typeof timer !== "undefined")
    clearTimeout(timer);
  let packet = rfactor.parseUDPPacket(msg);
  if(typeof packet === "undefined")
    return;
  if(packet.trackname != state.track || packet.sessionname != state.session || state.currtime > packet.currtime) {
    if(packet.trackname != state.track)
      io.emit('refresh');
    state.track = packet.trackname;
    state.session = packet.sessionname;
    state.currtime = packet.currtime;
    state.endtime = packet.endtime;
    state.maxlaps =  packet.maxlaps;
    state.phase.name = packet.phasename;
    state.phase.yellow = packet.yellowname;
    state.phase.sectors = packet.sectorflag;
    io.emit('session', state);
    exists = mapbuilder.start(packet.trackname);
    hotlaps.onUpdate(packet.trackname, packet.sessionname, null, [])
  } else {
    state.currtime = packet.currtime;
    if(state.phase.name != packet.phasename || state.phase.yellow != packet.yellowname || state.phase.sectors[0] != packet.sectorflag[0] || state.phase.sectors[1] != packet.sectorflag[1] || state.phase.sectors[2] != packet.sectorflag[2]) {
      state.phase.name = packet.phasename;
      state.phase.yellow = packet.yellowname;
      state.phase.sectors = packet.sectorflag;
      io.emit('phase', state.phase);
    }
  }
  let drivers = rfactor.getDriversMap(packet.veh);
  if(typeof drivers !== "undefined") {
    mapnamespace.emit('veh', rfactor.getVehPos(packet.veh));
    let temp = exists;
    if(!exists)
      exists = mapbuilder.onUpdate(packet.veh);
    if(temp !== exists)
      mapnamespace.emit('map', mapbuilder.getTrackMap());
    if(typeof state.drivers !== "undefined") {
      if(!rfactor.compareDriversMaps(drivers, state.drivers)) {
        io.emit('drivers', drivers);
        state.drivers = drivers;
      }
    } else {
      io.emit('drivers', drivers);
      state.drivers = drivers;
    }
  } else if(typeof state.drivers !== "undefined") {
    io.emit('drivers', drivers);
    state.drivers = drivers;
  }
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
  timer = setTimeout(function() {
    console.log('rF2 server offline');
    state = new Object();
    state.track = hotlaps.getTrack();
    state.session = '';
    state.currtime = 0;
    state.endtime = null;
    state.maxlaps =  null;
    state.drivers = null;
    state.phase = new Object();
    state.phase.name = '';
    state.phase.yellow = '';
    state.phase.sectors = [0,0,0];
    io.emit('session', state);
  }, 5000);
});

userver.on('listening', () => {
  const address = userver.address();
  console.log('RF2  listening on ' + config.RF2_LISTEN_PORT);
});

userver.bind(config.RF2_LISTEN_PORT);
