const fs   = require('fs');
const path = require('path');

var exists = false;
var map;
var bestpaths = [];
var besttime = 0;
var currpaths = new Object();
var currtrack;

function loadMap(track) {
  let temp;
  try {
    temp = JSON.parse(fs.readFileSync(path.normalize('maps/' + track + '.json')));
    if(typeof temp.version === "undefined")
      throw new Error('Bad map for ' + track);
    else if(temp.version == 1) {
      console.log('Loaded map for ' + track);
      exists = true;
    } else
      throw new Error('Incorrect map version for ' + track);
  } catch(err) {
    if (err.code === 'ENOENT') {
      console.log('No map found for ' + track);
      temp = new Object();
      temp.version = 1;
      temp.s1 = [];
      temp.s2 = [];
      temp.s3 = [];
      exists = false;
    } else {
      throw err;
    }
  }
  return temp;
}

function saveMap() {
  fs.writeFile(path.normalize('maps/' + currtrack + '.json'), JSON.stringify(map), (err) => {
    if (err) throw err;
  });
}

function start(track) {
  if(currtrack != track || !exists) {
    currtrack = track;
    map = loadMap(track);
    bestpaths = [];
    currpaths = new Object();
  }
  return exists;
}

function onUpdate(veh) {
  for(let i = 0; i < veh.length; i++) {
    if(typeof currpaths[veh[i].drivername] === "undefined") {
      currpaths[veh[i].drivername] = createPath(veh[i].laps, veh[i].posx, veh[i].posy);
    } else if(currpaths[veh[i].drivername].lap == veh[i].laps) {
      if(veh[i].sector == 1)
        currpaths[veh[i].drivername].s1.push({x: veh[i].posx, y: veh[i].posy});
      else if(veh[i].sector == 2)
        currpaths[veh[i].drivername].s2.push({x: veh[i].posx, y: veh[i].posy});
      else if(veh[i].sector == 0)
        currpaths[veh[i].drivername].s3.push({x: veh[i].posx, y: veh[i].posy});
    } else if(currpaths[veh[i].drivername].lap != veh[i].laps && veh[i].lastlap > 0) {
      currpaths[veh[i].drivername].t = veh[i].lastlap;
      if(bestpaths.length == 0 || besttime > veh[i].lastlap) {
        besttime = veh[i].lastlap;
        for(let j = bestpaths.length-1; j >= 0; j--) {
          if(bestpaths[j].t > besttime*1.05)
            bestpaths.pop();
        }
        bestpaths.push(currpaths[veh[i].drivername]);
        bestpaths.sort(compareLaps);
        console.log(bestpaths.length + ' ' + veh[i].drivername + ' set new best ' + veh[i].lastlap);
        if(testEnd())
          break;
      } else if(besttime*1.05 > veh[i].lastlap) {
        bestpaths.push(currpaths[veh[i].drivername]);
        bestpaths.sort(compareLaps);
        console.log(bestpaths.length + ' ' + veh[i].drivername + ' set within 105% ' + veh[i].lastlap);
        if(testEnd())
          break;
      }
      currpaths[veh[i].drivername] = createPath(veh[i].laps, veh[i].posx, veh[i].posy);
    } else if(currpaths[veh[i].drivername].lap != veh[i].laps) {
      currpaths[veh[i].drivername] = createPath(veh[i].laps, veh[i].posx, veh[i].posy);
    }
  }
  return exists;
}

function createPath(lap, x, y) {
  let temp = new Object();
  temp.lap = lap;
  temp.s1 = [];
  temp.s2 = [];
  temp.s3 = [];
  temp.s1.push({x: x, y: y});
  return temp;
}

function testEnd() {
  if(bestpaths.length == 5) {
    exists = true;
    map.s1 = bestpaths[0].s1;
    map.s2 = bestpaths[0].s2;
    map.s3 = bestpaths[0].s3;
    map.maxx = map.s1[0].x;
    map.maxy = map.s1[0].y;
    map.minx = map.s1[0].x;
    map.miny = map.s1[0].y;
    findMapEdges(map.s1);
    findMapEdges(map.s2);
    findMapEdges(map.s3);
    console.log('maxx: ' + map.maxx + '\tminx: ' + map.minx);
    console.log('maxy: ' + map.maxy + '\tminy: ' + map.miny);
    bestpaths = [];
    currpaths = new Object();
    saveMap();
  }
  return exists;
}

function findMapEdges(s) {
  for(let i = 0; i < s.length; i++) {
    if(s[i].x > map.maxx)
      map.maxx = s[i].x;
    else if(s[i].x < map.minx)
      map.minx = s[i].x;
    if(s[i].y > map.maxy)
      map.maxy = s[i].y;
    else if(s[i].y < map.miny)
      map.miny = s[i].y;
  }
}

function compareLaps(a, b) {
  if (a.t < b.t)
    return -1;
  if (a.t > b.t)
    return 1;
  return 0;
}

function getTrackMap() {
  return map;
}

module.exports = {
  start: start,
  onUpdate: onUpdate,
  getTrackMap: getTrackMap
}