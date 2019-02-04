const fs   = require('fs');
const path = require('path');
const config = require('../config');
const DB_VERSION = 1;

var db = new Object();
var pendinglaps = new Object();
var state = new Object();

try {
  state = JSON.parse(fs.readFileSync(path.join('data', 'state.json')));
} catch(err) {
  if (err.code === 'ENOENT') {
    console.log('No hotlaps state found');
    state = new Object();
    state.lasttrack = '';
  } else {
    throw err;
  }
}

state.lastsession = '';
state.dirty = false;

if(state.lasttrack !== '')
  db = loadDB(state.lasttrack);
else {
  db.version = 1;
  db.data = new Object();
}

function onUpdate(track, session, drivers, events) {
  let updates = [];
  if(state.lasttrack != track || state.lastsession != session) {
    if(state.lasttrack != track)
      db = loadDB(track);
    state.lasttrack = track;
    state.lastsession = session;
    pendinglaps = new Object();
    fs.writeFile(path.join('data', 'state.json'), JSON.stringify(state), (err) => {
      if (err) throw err;
    });
  }
  for(let i = 0; i < events.length; i++) {
    if(typeof pendinglaps[events[i].name] === "undefined") {
      if(events[i].point == 1) {
        pendinglaps[events[i].name] = new Object();
        pendinglaps[events[i].name].s1 = events[i].t;
      }
    } else if(typeof pendinglaps[events[i].name].s1  !== "undefined" && events[i].point == 2) {
      pendinglaps[events[i].name].s2 = events[i].t - pendinglaps[events[i].name].s1;
    } else if(typeof pendinglaps[events[i].name].s1  !== "undefined" && typeof pendinglaps[events[i].name].s2  !== "undefined" && events[i].point == 0) {
      pendinglaps[events[i].name].s3 = events[i].t - pendinglaps[events[i].name].s2 - pendinglaps[events[i].name].s1;
      pendinglaps[events[i].name].t = events[i].t;
      let res = updateDB(pendinglaps[events[i].name], events[i].name, drivers[events[i].name]);
      if(typeof res !== "undefined")
        updates.push(res);
      delete pendinglaps[events[i].name];
    }
  }
  if(state.dirty)
    saveDB();
  state.dirty = false;
  if(updates.length > 0)
    return updates;
}

function updateDB(lap, name, veh) {
  let dirty = false;
  if(lap.s1 <= 0 || lap.s2 <= 0 || lap.s3 <= 0 || lap.t <= 0)
    return;
  lap.timestamp = new Date().getTime();
  if(typeof db.data[name] === "undefined") {
    db.data[name] = new Object();
    let c = new Object();
    let n = new Object();
    n.lap = lap;
    n.sectors = new Object();
    n.sectors.s1 = lap.s1;
    n.sectors.s2 = lap.s2;
    n.sectors.s3 = lap.s3;
    n.ai = veh.ai;
    c[veh.name] = n;
    db.data[name][veh.vehclass] = c;
    dirty = true;
  } else if(typeof db.data[name][veh.vehclass] === "undefined") {
    let c = new Object();
    let n = new Object();
    n.lap = lap;
    n.sectors = new Object();
    n.sectors.s1 = lap.s1;
    n.sectors.s2 = lap.s2;
    n.sectors.s3 = lap.s3;
    n.ai = veh.ai;
    c[veh.name] = n;
    db.data[name][veh.vehclass] = c;
    dirty = true;
  } else if(typeof db.data[name][veh.vehclass][veh.name] === "undefined") {
    let n = new Object();
    n.lap = lap;
    n.sectors = new Object();
    n.sectors.s1 = lap.s1;
    n.sectors.s2 = lap.s2;
    n.sectors.s3 = lap.s3;
    n.ai = veh.ai;
    db.data[name][veh.vehclass][veh.name] = n;
    dirty = true;
  } else {
    let oldlap = db.data[name][veh.vehclass][veh.name].lap;
    let oldsec = db.data[name][veh.vehclass][veh.name].sectors;
    if(lap.s1 < oldsec.s1) {
      db.data[name][veh.vehclass][veh.name].sectors.s1 = lap.s1;
      dirty = true;
    }
    if(lap.s2 < oldsec.s2) {
      db.data[name][veh.vehclass][veh.name].sectors.s2 = lap.s2;
      dirty = true;
    }
    if(lap.s3 < oldsec.s3) {
      db.data[name][veh.vehclass][veh.name].sectors.s3 = lap.s3;
      dirty = true;
    }
    if(lap.t < oldlap.t) {
      db.data[name][veh.vehclass][veh.name].lap = lap;
      new Date().getTime()/1000|0
      dirty = true;
    }
  }
  if(dirty) {
    state.dirty = true;
    let res = new Object();
    res.name = name;
    res.veh = veh.name;
    res.vehclass = veh.vehclass;
    res.bestlap = lap;
    res.ai = veh.ai;
    return res;
  }
}

function saveDB() {
  fs.writeFile(path.normalize('data/hotlaps/' + state.lasttrack + '.json'), JSON.stringify(db), (err) => {
    if (err) throw err;
  });
}

function loadDB(track) {
  let temp;
  try {
    temp = JSON.parse(fs.readFileSync(path.normalize('data/hotlaps/' + track + '.json')));
    if(typeof temp.version === "undefined")
      throw new Error('Bad db for ' + track);
    else if(temp.version == 1)
      console.log('Loaded db for ' + track);
    else
      throw new Error('Incorrect db version for ' + track);
  } catch(err) {
    if (err.code === 'ENOENT') {
      console.log('No db found for ' + track);
      temp = new Object();
      temp.version = 1;
      temp.data = new Object();
    } else {
      throw err;
    }
  }
  return temp;
}

function getData() {
  return db.data;
}

function getTrack() {
  return state.lasttrack;
}

module.exports = {
  onUpdate: onUpdate,
  getData: getData,
  getTrack: getTrack
}