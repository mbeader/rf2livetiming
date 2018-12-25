const config = require('./config');

function parseUDPPacket(msg)  {
  let p = new Object();
  //console.log(msg.toString('hex'));
  p.version = msg.readUInt8(0);
  p.pnum = msg.readUInt8(1);
  p.sequence = msg.readUInt16LE(2);
  p.type = msg.readUInt8(4);
  if(p.type == 2)
    return parseScoringPacket(msg, p);
}

function parseScoringPacket(msg, p)  {
  let pointer = 5;
  for(pointer = 5; pointer < 69; pointer++)
    if(msg.readUInt8(pointer) == 0)
      break;
  p.trackname = msg.toString('ascii', 5, pointer);
  p.sessionid = msg.readUInt32LE(++pointer);
  switch(p.sessionid) {
    case 1: p.sessionname = "Practice";
    break;
    case 5: p.sessionname = "Qualifying";
    break;
    case 9: p.sessionname = "Warmup";
    break;
    case 10: p.sessionname = "Race";
    break;
  }
  pointer += 4;
  p.currtime = msg.readDoubleLE(pointer);
  pointer += 8;
  p.endtime = msg.readDoubleLE(pointer);
  pointer += 8;
  p.lapdist = msg.readDoubleLE(pointer);
  pointer += 8;
  p.numveh = msg.readUInt32LE(pointer);
  pointer += 4;
  p.gamephase = msg.readUInt8(pointer);
  p.yellowstate = msg.readUInt8(++pointer);
  p.sectorflag = [msg.readUInt8(++pointer), msg.readUInt8(++pointer), msg.readUInt8(++pointer)];
  p.startlight = msg.readUInt8(++pointer);
  p.numredlights = msg.readUInt8(++pointer);
  pointer++;
  //console.log(p.sessionname + ' ' + p.startlight + '\t' + p.numredlights);
  p.veh = [];
  for(let i = 0; i < p.numveh; i++) {
    let veh = new Object();
    veh.posx = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.posy = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.place = msg.readUInt8(pointer++);
    veh.lapdist = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.lateralpos = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.speed = msg.readDoubleLE(pointer);
    pointer += 8;
    let j = 0;
    for(j = 0; j < pointer + 64; j++)
      if(msg.readUInt8(pointer+j) == 0)
        break;
    veh.vehname = msg.toString('ascii', pointer, pointer+j);
    pointer = pointer + j + 1;
    for(j = 0; j < pointer + 32; j++)
      if(msg.readUInt8(pointer+j) == 0)
        break;
    veh.drivername = msg.toString('ascii', pointer, pointer+j);
    pointer = pointer + j + 1;
    for(j = 0; j < pointer + 32; j++)
      if(msg.readUInt8(pointer+j) == 0)
        break;
    veh.vehclass = msg.toString('ascii', pointer, pointer+j);
    pointer = pointer + j + 1;
    veh.laps = msg.readUInt16LE(pointer);
    pointer += 2;
    veh.bests1 = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.bests2 = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.bestlap = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.lasts1 = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.lasts2 = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.lastlap = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.currs1 = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.currs2 = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.timebehindleader = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.lapsbehindleader = msg.readUInt32LE(pointer);
    pointer += 4;
    veh.timebehindnext = msg.readDoubleLE(pointer);
    pointer += 8;
    veh.lapsbehindnext = msg.readUInt32LE(pointer);
    pointer += 4;
    veh.numpits = msg.readUInt16LE(pointer);
    pointer += 2;
    veh.numpenalties = msg.readUInt16LE(pointer);
    pointer += 2;
    veh.inpit = msg.readUInt8(pointer++);
    veh.sector = msg.readUInt8(pointer++);
    veh.status = msg.readUInt8(pointer++);
    //console.log(veh.drivername + ' ' + veh.vehclass + '\t' + veh.speed);
    p.veh.push(veh);
  }
  pointer += 4;
  p.results = msg.toString('ascii', pointer);
  return p;
}

function parseResultStream(res) {
  let rawevents = res.split('\n');
  let events = [];
  for(let i = 0; i < rawevents.length; i++) {
    if(rawevents[i].startsWith('<Score'))
      events.push(xml2Obj(rawevents[i].split('>')[1].split('</Score')[0]));
  }
  return events;
}

function xml2Obj(xml) {
  let e = new Object();
  if(xml.startsWith('Checkered')) {
  } else {
    e.type = 'sector';
    let endofname = xml.search(/\) lap=/);
    let i = endofname;
    while (xml.charAt(i) != '(')
      i--;
    e.name = xml.slice(0,i);
    let data = xml.slice(endofname+2).split(/( |=)/);
    e.lap = Number.parseInt(data[2]);
    e.point = Number.parseInt(data[6]);
    e.t = Number.parseFloat(data[10]);
    e.et = Number.parseFloat(data[14]);
  }
  return e;
}

function getDriversMap(veh) {
  let drivers = new Object();
  for(let i = 0; i < veh.length; i++) {
    let vehicle = new Object();
    vehicle.name = veh[i].vehname;
    vehicle.vehclass = veh[i].vehclass;
    drivers[veh[i].drivername] = vehicle;
  }
  return drivers;
}

module.exports = {
  parseUDPPacket: parseUDPPacket,
  parseResultStream: parseResultStream,
  getDriversMap: getDriversMap
}