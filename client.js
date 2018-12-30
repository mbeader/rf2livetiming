var socket = io('/');
var hotlaps;

socket.on('session', function (state) {
  if(state.session == '') {
    document.getElementById('info').textContent = state.track;
    updateDrivers(state.drivers)
  } else
    document.getElementById('info').textContent = state.session + ' @ ' + state.track;
});

socket.on('hotlap', function (laps) {
  let found = false;
  for(let i = 0; i < laps.length; i++) {
    for(let j = 0; j < hotlaps.length; j++) {
      if(hotlaps[j].name == laps[i].name && hotlaps[j].vehclass == laps[i].vehclass && hotlaps[j].veh == laps[i].veh) {
        hotlaps[j].bestlap = laps[i].bestlap;
        found = true;
        break;
      }
    }
    if(!found)
      hotlaps.push(laps[i]);
  }
  hotlaps.sort(compareHotlaps);
  buildTable(hotlaps);
});

socket.on('drivers', function (drivers) {
  updateDrivers(drivers);
});

document.addEventListener('DOMContentLoaded', initLoad, false);
function initLoad(e) {
  let req = new XMLHttpRequest();
  req.addEventListener('load', function () {
    let res = JSON.parse(this.responseText);
    document.title = res.title;
    document.getElementById('banner').firstElementChild.setAttribute('src', '/' + res.banner);
    document.getElementById('message').firstElementChild.textContent = res.message;
    document.getElementById('message').firstElementChild.setAttribute('href',  res.link)
    if(res.info.track !== '' && res.info.session !== '')
      document.getElementById('info').textContent = res.info.session + ' @ ' + res.info.track;
    else if(res.info.track !== '')
      document.getElementById('info').textContent = res.info.track;
    hotlaps = hotlaps2List(res.data);
    buildTable(hotlaps);
    if(typeof res.info.drivers !== "undefined" && res.info.drivers !== null) {
      buildLiveTable(drivers2List(res.info.drivers));
    } else
      document.getElementById('live').style['display'] = 'none';
  });
  req.open('GET', '/init');
  req.send();
}

function hotlaps2List(data) {
  let list = [];
  Object.keys(data).forEach(function(name, index) {
    Object.keys(data[name]).forEach(function(vehclass, index) {
      Object.keys(data[name][vehclass]).forEach(function(veh, index) {
        let t = new Object();
        t.name = name;
        t.vehclass = vehclass;
        t.veh = veh;
        t.bestlap = data[name][vehclass][veh].lap;
        list.push(t);
      });
    });
  });
  list.sort(compareHotlaps);
  return list;
}

function drivers2List(data) {
  let list = [];
  Object.keys(data).forEach(function(name, index) {
    let t = new Object();
    t.name = name;
    t.vehclass = data[name].vehclass;
    t.veh = data[name].name;
    t.place = data[name].place;
    list.push(t);
  });
  list.sort(compareDrivers);
  return list;
}

function updateDrivers(drivers) {
  if(typeof drivers !== "undefined" && drivers !== null) {
    buildLiveTable(drivers2List(drivers));
    document.getElementById('live').style['display'] = '';
  } else {
    document.getElementById('live').getElementsByTagName('tbody')[0].innerHTML = '';
    document.getElementById('live').style['display'] = 'none';
  }
}  

function compareHotlaps(a, b) {
  if (a.bestlap.t < b.bestlap.t)
    return -1;
  if (a.bestlap.t > b.bestlap.t)
    return 1;
  return 0;
}

function compareDrivers(a, b) {
  if (a.place < b.place)
    return -1;
  if (a.place > b.place)
    return 1;
  return 0;
}

function buildTable(laps) {
  let t = '';
  for(let i = 0; i < laps.length; i++) {
    if(i % 2 == 0)
      t += '<tr class="even">';
    else
      t += '<tr>';
    t += '<td>' + (i + 1) + '</td>';
    t += '<td>' + laps[i].name + '</td>';
    t += '<td>' + laps[i].veh + '</td>';
    t += '<td>' + laps[i].vehclass + '</td>';
    if(laps[i].bestlap.s1 == undefined)
      t += '<td class="time">-</td>';
    else
      t += '<td class="time">' + laps[i].bestlap.s1.toFixed(3) + '</td>';
    if(laps[i].bestlap.s2 == undefined)
      t += '<td class="time">-</td>';
    else
      t += '<td class="time">' + laps[i].bestlap.s2.toFixed(3) + '</td>';
    if(laps[i].bestlap.s3 == undefined)
      t += '<td class="time">-</td>';
    else
      t += '<td class="time">' + laps[i].bestlap.s3.toFixed(3) + '</td>';
    t += '<td class="time">' + laps[i].bestlap.t.toFixed(3) + '</td></tr>';
  }
  document.getElementById('hotlaps').getElementsByTagName('tbody')[0].innerHTML = t;
}

function buildLiveTable(drivers) {
  let t = '';
  for(let i = 0; i < drivers.length; i++) {
    if(i % 2 == 0)
      t += '<tr class="even">';
    else
      t += '<tr>';
    t += '<td>' + (i + 1) + '</td>';
    t += '<td>' + drivers[i].name + '</td>';
    t += '<td>' + drivers[i].veh + '</td>';
    t += '<td>' + drivers[i].vehclass + '</td></tr>';
  }
  document.getElementById('live').getElementsByTagName('tbody')[0].innerHTML = t;
}