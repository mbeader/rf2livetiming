var socket = io('/');
var hltable;
var classbests = new Object();
var newupdates = [];

socket.on('session', function (state) {
  if(state.session == '') {
    document.getElementById('info').textContent = state.track;
    updateDrivers(state.drivers)
  } else
    document.getElementById('info').textContent = state.session + ' @ ' + state.track;
});

socket.on('hotlap', function (laps) {
  updateHotlapsTable(laps);
  sortHotlapsTable();
  for(let i = 0; i < newupdates.length; i++) {
    if(Number.parseFloat(newupdates[i].children[7].textContent) == classbests[newupdates[i].children[3].textContent]) {
      newupdates[i].classList.add('cbest');
      setTimeout(function(e) {
        e.classList.remove('cbest');
      }, 10000, newupdates[i]);
    } else {
      newupdates[i].classList.add('pbest');
      setTimeout(function(e) {
        e.classList.remove('pbest');
      }, 10000, newupdates[i]);
    }
  }
  newupdates = [];
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
    hltable = document.getElementById('hotlaps').getElementsByTagName('tbody')[0];
    buildHotlapsTable(hotlaps2List(res.data));
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
  let at = Number.parseFloat(a.children[7].textContent);
  let bt = Number.parseFloat(b.children[7].textContent);
  if (at < bt)
    return -1;
  if (at > bt)
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

function updateHotlapsTable(laps) {
  let found = false;
  for(let i = 0; i < laps.length; i++) {
    for(let j = 0; j < hltable.children.length; j++) {
      if(hltable.children[j].children[1].textContent == laps[i].name && hltable.children[j].children[3].textContent == laps[i].vehclass && hltable.children[j].children[2].textContent == laps[i].veh) {
        if(Number.parseFloat(hltable.children[j].children[7].textContent) > laps[i].bestlap.t) {
          hltable.children[j].children[4].textContent = laps[i].bestlap.s1.toFixed(3);
          hltable.children[j].children[5].textContent = laps[i].bestlap.s2.toFixed(3);
          hltable.children[j].children[6].textContent = laps[i].bestlap.s3.toFixed(3);
          hltable.children[j].children[7].textContent = laps[i].bestlap.t.toFixed(3);
          newupdates.push(hltable.children[j]);
        }
        found = true;
        break;
      }
    }
    if(!found) {
      let temp = createHotlapsElement(laps[i]);
      hltable.appendChild(temp);
      newupdates.push(temp);
    }
  }
}

function createHotlapsElement(lap) {
  let e = document.createElement('tr');
  let t = '';
  t += '<td></td>';
  t += '<td>' + lap.name + '</td>';
  t += '<td>' + lap.veh + '</td>';
  t += '<td>' + lap.vehclass + '</td>';
  if(lap.bestlap.s1 == undefined)
    t += '<td class="time">-</td>';
  else
    t += '<td class="time">' + lap.bestlap.s1.toFixed(3) + '</td>';
  if(lap.bestlap.s2 == undefined)
    t += '<td class="time">-</td>';
  else
    t += '<td class="time">' + lap.bestlap.s2.toFixed(3) + '</td>';
  if(lap.bestlap.s3 == undefined)
    t += '<td class="time">-</td>';
  else
    t += '<td class="time">' + lap.bestlap.s3.toFixed(3) + '</td>';
  t += '<td class="time">' + lap.bestlap.t.toFixed(3) + '</td>';
  e.innerHTML = t;
  return e;
}

function sortHotlapsTable() {
  let list = Array.from(hltable.children).sort(compareHotlaps);
  for(let i = 0; i < list.length; i++) {
    list[i].firstElementChild.textContent = i+1;
    if(i % 2 != 0)
      list[i].classList.add('even');
    else
      list[i].classList.remove('even');
    let c = list[i].children[3].textContent;
    if(typeof classbests[c] === "undefined" || classbests[c] > Number.parseFloat(list[i].children[7].textContent))
      classbests[c] = Number.parseFloat(list[i].children[7].textContent);
    hltable.appendChild(list[i]);
}

function buildHotlapsTable(laps) {
  for(let i = 0; i < laps.length; i++)
    hltable.appendChild(createHotlapsElement(laps[i]));
  sortHotlapsTable();
}

function buildLiveTable(drivers) {
  let t = '';
  for(let i = 0; i < drivers.length; i++) {
    if(i % 2 != 0)
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