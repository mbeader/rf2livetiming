const fs = require('fs');
const path = require('path');
var XML = require('pixl-xml');

function parseResults(data) {
  let d = data.split('\0');
  let filename = d[0].substring(0, d[0].length-4);
  let xmlstr = d[1];
  let res = parseResultsXML(xmlstr);
  let bestlaps = findBestLaps(sessionResults(res)[0]);
  //console.log(JSON.stringify(bestlaps));
  saveResults(filename, xmlstr, JSON.stringify(res));
  return bestlaps;
}

function parseResultsXML(xmlstr) {
  xmlstr = ''.concat(xmlstr.split('<!DOCTYPE rF [\r\n<!ENTITY rFEnt "rFactor Entity">\r\n]>\r\n'));
  return XML.parse(xmlstr).RaceResults;
}

function sessionResults(res) {
  let a = [];
  if(typeof res.TestDay != 'undefined')
    a.push(res.TestDay);
  
  if(typeof res.Practice1 != 'undefined')
    a.push(res.Practice1);
  if(typeof res.Practice2 != 'undefined')
    a.push(res.Practice2);
  if(typeof res.Practice3 != 'undefined')
    a.push(res.Practice3);
  if(typeof res.Practice4 != 'undefined')
    a.push(res.Practice4);
  
  if(typeof res.Qualify != 'undefined')
    a.push(res.Qualify);
  if(typeof res.Qualify2 != 'undefined')
    a.push(res.Qualify2);
  if(typeof res.Qualify3 != 'undefined')
    a.push(res.Qualify3);
  if(typeof res.Qualify4 != 'undefined')
    a.push(res.Qualify4);
  
  if(typeof res.Warmup != 'undefined')
    a.push(res.Warmup);
  
  if(typeof res.Race != 'undefined')
    a.push(res.Race);
  if(typeof res.Race2 != 'undefined')
    a.push(res.Race2);
  if(typeof res.Race3 != 'undefined')
    a.push(res.Race3);
  if(typeof res.Race4 != 'undefined')
    a.push(res.Race4);
  
  if(a.length > 1)
    console.log('Warning: more than one session in result');
  return a;
}

function findBestLaps(results) {
  var drivers = [];
  if(typeof results != 'undefined' && typeof results.Driver != 'undefined') {
    let basetime = Number.parseInt(results.DateTime);
    for(let i = 0; i < results.Driver.length; i++) {
      if(typeof results.Driver[i].Lap == 'undefined')
        break;
      let d = new Object();
      d.name = results.Driver[i].Name;
      d.veh = results.Driver[i].VehName;
      d.vehclass = results.Driver[i].CarClass;
      d.laps = Number.parseInt(results.Driver[i].Laps);
      let lapdata = [];
      for(let j = 0; j < results.Driver[i].Lap.length; j++) {
        if(results.Driver[i].Lap[j]._Data != '--.----') {
          let lapobj = new Object();
          lapobj.t = results.Driver[i].Lap[j]._Data;
          if(typeof results.Driver[i].Lap[j].s1 != 'undefined')
            lapobj.s1 = results.Driver[i].Lap[j].s1;
          if(typeof results.Driver[i].Lap[j].s2 != 'undefined')
            lapobj.s2 = results.Driver[i].Lap[j].s2;
          if(typeof results.Driver[i].Lap[j].s3 != 'undefined')
            lapobj.s3 = results.Driver[i].Lap[j].s3;
          
          if(typeof results.Driver[i].Lap[j].fuel != 'undefined')
            lapobj.fuel = Number.parseFloat(results.Driver[i].Lap[j].fuel);
          if(typeof results.Driver[i].Lap[j].twfl != 'undefined') {
            lapobj.wear = new Object();
            lapobj.wear.fl = Number.parseFloat(results.Driver[i].Lap[j].twfl);
            lapobj.wear.fr = Number.parseFloat(results.Driver[i].Lap[j].twfr);
            lapobj.wear.rl = Number.parseFloat(results.Driver[i].Lap[j].twrl);
            lapobj.wear.rr = Number.parseFloat(results.Driver[i].Lap[j].twrr);
          }
          if(typeof results.Driver[i].Lap[j].fcompound != 'undefined') {
            lapobj.compound = new Object();
            lapobj.compound.f = results.Driver[i].Lap[j].fcompound;
            lapobj.compound.r = results.Driver[i].Lap[j].rcompound;
          }
          
          if(typeof results.Driver[i].Lap[j].et != 'undefined')
            lapobj.timestamp = basetime + Math.round(results.Driver[i].Lap[j].et);
          lapobj.verified = 2;
          lapdata.push(lapobj);
        }
      }
      if(lapdata.length > 0) {
        d.bestlap = lapdata[0];
        for(let j = 1; j < lapdata.length; j++)
          if(Number.parseFloat(lapdata[j].t) < Number.parseFloat(d.bestlap.t))
            d.bestlap = lapdata[j];
        drivers.push(d);
      }
    }
  }
  return drivers;
}

function saveResults(filename, xmlstr, jsonstr) {
  fs.writeFileSync(path.join('data', 'results', 'xml', filename+'.xml'), xmlstr);
  fs.writeFileSync(path.join('data', 'results', 'json', filename+'.json'), jsonstr);
}

module.exports = {
  parseResults: parseResults
}