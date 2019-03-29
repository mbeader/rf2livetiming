const http = require('http');
var server = http.createServer(handler);
var io = require('socket.io')(server);
const net = require('net');
const dgram = require('dgram');
const fs   = require('fs');
const path = require('path');
const url  = require('url');
const config = require('../config');
const rfactor = require('./rfactor');
const results = require('./results');
const hotlaps = require('./hotlaps');
const mapbuilder = require('./mapbuilder');
const Tracker = require('./tracker');
const classcolors = require('../config/classes');

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
var rf2server = {name: null, ip: null, port: null};
var timer;
var exists = false;
var sessionbests = new Tracker();
var lock = null;

server.listen(config.HTTP_LISTEN_PORT);
console.log('HTTP listening on ' + config.HTTP_LISTEN_PORT);

function handler (req, res) {
  var uri = url.parse(req.url, true);
  let content;
  switch(uri.pathname) {
    case '/':
    case '/index.html':
      sendFile(res, path.join('www', 'index.html'), 'text/html');
      break;
    case '/init':
      res.writeHead(200, {'Content-type': 'application/json'});
      content = new Object();
      content.info = state;
      delete content.info.drivers;
      if(state.track == '')
        content.info.track = hotlaps.getTrack();
      content.data = hotlaps.getData();
      res.end(JSON.stringify(content), 'utf-8');
      break;
    case '/info':
      res.writeHead(200, {'Content-type': 'application/json'});
      content = new Object();
      content.name = rf2server.name;
      content.ip = config.RF2_PUBLIC_ADDR;
      content.port = rf2server.port;
      res.end(JSON.stringify(content), 'utf-8');
      break;
    case '/tracks':
      res.writeHead(200, {'Content-type': 'application/json'});
      content = new Object();
      content.current = (state.track == '') ? null : state.track;
      content.tracks = hotlaps.getTracks();
      res.end(JSON.stringify(content), 'utf-8');
      break;
    case '/laptimes':
      res.writeHead(200, {'Content-type': 'application/json'});
      content = hotlaps.getData(uri.query.t);
      res.end(JSON.stringify(content), 'utf-8');
      break;
    case '/live':
    case '/map':
    case '/laps':
      sendFile(res, path.join('www', uri.pathname.substring(1) + '.html'), 'text/html');
      break;
    case '/socket.js':
    case '/common.js':
    case '/home.js':
    case '/session.js':
    case '/live.js':
    case '/map.js':
    case '/laps.js':
      sendFile(res, path.join('client', uri.pathname.substring(1)), 'application/javascript');
      break;
    case '/TomorrowNight.css':
      sendFile(res, path.join('www', 'css', uri.pathname), 'text/css');
      break;
    default:
      send404(res);
  }
}

function sendFile(res, file, contenttype) {
  fs.readFile(file, function(error, content) {
    if(error)
      send404(res);
    else {
      res.writeHead(200, {'Content-type': contenttype});
      res.end(content, 'utf-8');
    }
  });
}

function send404(res) {
    res.writeHead(404, {'Content-type': 'text/html'});
    res.end('404 File not found', 'utf-8');
}

io.on('connection', function (socket) {
  if(socket.handshake.address == config.IPV4_LOOPBACK || socket.handshake.address == '::ffff:' + config.IPV4_LOOPBACK || socket.handshake.address == '::1') {
    socket.on('kill', function () {
      console.log('Terminating');
      userver.close();
      setTimeout(() => {
        process.exit(0);
      }, 8000);
    });
  }
  
  socket.on('join', function (room) {
    socket.join(room);
    if(room == 'map') {
      socket.emit('classes', classcolors);
      if(exists)
        socket.emit('map', mapbuilder.getTrackMap());
    } else if(room == 'live')
      socket.emit('bests', sessionbests.bests);
  });
});

const userver = dgram.createSocket('udp4');

userver.on('error', (err) => {
  console.log(`server error:\n${err.stack}`);
  userver.close();
});

userver.on('message', (msg, rinfo) => {
  if(rinfo.address != config.RF2_SRC_ADDR)
    return;
  if(lock == null)
    lock = {addr: rinfo.address, port: rinfo.port};
  else if(lock.addr !== rinfo.address || lock.port !== rinfo.port)
    return;
  if(typeof timer !== "undefined")
    clearTimeout(timer);
  let packet = rfactor.parseUDPPacket(msg);
  if(typeof packet === "undefined")
    return;
  rf2server = packet.server;
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
    sessionbests = new Tracker();
    io.to('live').emit('session', state);
    io.to('live').emit('bests', sessionbests.bests);
    io.to('map').emit('clear');
    exists = mapbuilder.start(packet.trackname);
    if(exists)
      io.to('map').emit('map', mapbuilder.getTrackMap());
    hotlaps.onUpdate(packet.trackname, packet.sessionname, null, [])
  } else {
    state.currtime = packet.currtime;
    if(state.phase.name != packet.phasename || state.phase.yellow != packet.yellowname || state.phase.sectors[0] != packet.sectorflag[0] || state.phase.sectors[1] != packet.sectorflag[1] || state.phase.sectors[2] != packet.sectorflag[2]) {
      state.phase.name = packet.phasename;
      state.phase.yellow = packet.yellowname;
      state.phase.sectors = packet.sectorflag;
      io.to('live').emit('phase', state.phase);
    }
  }
  let drivers = rfactor.getDriversMap(packet.veh);
  if(typeof drivers !== "undefined") {
    io.to('map').emit('veh', rfactor.getVehPos(packet.veh));
    let bests = sessionbests.onUpdate(packet.veh);
    if(bests != null) {
      io.to('live').emit('bests', bests);
    }
    io.to('live').emit('vehs', packet.veh);
    let temp = exists;
    if(!exists)
      exists = mapbuilder.onUpdate(packet.veh);
    if(temp !== exists)
      io.to('map').emit('map', mapbuilder.getTrackMap());
    if(typeof state.drivers !== "undefined" && state.drivers !== null) {
      if(!rfactor.compareDriversMaps(drivers, state.drivers)) {
        state.drivers = drivers;
      }
    } else {
      state.drivers = drivers;
    }
  } else if(typeof state.drivers !== "undefined") {
    io.to('live').emit('vehs', packet.veh);
    state.drivers = drivers;
  }
  let events = rfactor.parseEventStream(packet.results);
  if(typeof events === "undefined")
    console.log('udef');
  if(typeof events.score[0] === "undefined")
    ;
  else {
    let updates = hotlaps.onUpdate(packet.trackname, packet.sessionname, drivers, events.score);
    if(typeof updates !== "undefined") {
      io.to('hotlaps').emit('hotlap', updates);
    }
  }
  if(events.chat.length > 0)
    io.to('chat').emit('message', events.chat);
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
    rf2server = {name: null, ip: null, port: null};
    sessionbests = new Tracker();
    io.to('live').emit('session', state);
    io.to('live').emit('bests', sessionbests.bests);
    lock = null;
  }, 10000);
});

userver.on('listening', () => {
  const address = userver.address();
  console.log('RF2  listening on ' + config.RF2_LISTEN_PORT);
});

userver.bind(config.RF2_LISTEN_PORT);

const tserver = net.createServer((s) => {
  let chunk = '';
  s.on('data', function(data) {
    chunk += data;
  });
  
  s.on('end', function() {
    let bestlaps = results.parseResults(chunk);
    if(bestlaps.length > 0)
      hotlaps.verify(bestlaps);
  });
});

tserver.on('error', (err) => {
  throw err;
});

tserver.listen(config.RF2_LISTEN_PORT, () => {
});