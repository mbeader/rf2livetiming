const fs = require('fs');
const path = require('path');
var XML = require('pixl-xml');
const config = require('../config');

function parseResults(data) {
  let d = data.split('\0');
  let filename = d[0].substring(0, d[0].length-4);
  let xmlstr = d[1];
  let res = parseResultsXML(xmlstr);
  let bestlaps = findBestLaps(sessionResults(res));
  console.log(JSON.stringify(bestlaps));
  saveResults(filename, xmlstr, JSON.stringify(res));
}


function parseResultsXML(xmlstr) {
  xmlstr = ''.concat(xmlstr.split('<!DOCTYPE rF [\r\n<!ENTITY rFEnt "rFactor Entity">\r\n]>\r\n'));
  return XML.parse(xmlstr).RaceResults;
}

function sessionResults(res) {
  if(typeof res.Practice1 != 'undefined')
    return res.Practice1;
  else if(typeof res.Qualify != 'undefined')
    return res.Qualify;
  else if(typeof res.Race != 'undefined')
    return res.Race;
}

function findBestLaps(results) {
  console.log(results);
  var drivers = [];
  if(results != undefined) {
    for(let i = 0; i < results.Driver.length; i++) {
      if(results.Driver[i].Lap == undefined)
        break;
      let d = new Object();
      d.name = results.Driver[i].Name;
      d.veh = results.Driver[i].VehName;
      d.laps = Number.parseInt(results.Driver[i].Laps);
      let lapdata = [];
      for(let j = 0; j < results.Driver[i].Lap.length; j++) {
        if(results.Driver[i].Lap[j]._Data != '--.----') {
          let lapobj = new Object();
          lapobj.total = results.Driver[i].Lap[j]._Data;
          if(results.Driver[i].Lap[j].s1 != undefined)
            lapobj.s1 = results.Driver[i].Lap[j].s1;
          if(results.Driver[i].Lap[j].s2 != undefined)
            lapobj.s2 = results.Driver[i].Lap[j].s2;
          if(results.Driver[i].Lap[j].s3 != undefined)
            lapobj.s3 = results.Driver[i].Lap[j].s3;
          lapdata.push(lapobj);
        }
      }
      if(lapdata.length > 0) {
        d.bestlap = lapdata[0];
        for(let j = 1; j < lapdata.length; j++)
          if(Number.parseFloat(lapdata[j].total) < Number.parseFloat(d.bestlap.total))
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