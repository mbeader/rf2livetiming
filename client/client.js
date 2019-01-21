var socket = io('/');
var hltable;
var classbests = new Object();
var newupdates = [];
var rtime;
var timelastset;
var rtimeinterval;

socket.on('session', function (state) {
  if(state.session == '') {
    document.getElementById('session').textContent = state.track;
    updatePhase(null);
    updateDrivers(state.drivers);
  } else {
    document.getElementById('session').textContent = state.session + ' @ ' + state.track;
    updatePhase(state.phase);
  }
  setRemainingTime(state.currtime, state.endtime);
});

socket.on('phase', function (phase) {
  updatePhase(phase);
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

socket.on('refresh', function () {
  console.log('GOT');
  location.reload(true);
});

document.addEventListener('DOMContentLoaded', initLoad, false);
function initLoad(e) {
  let req = new XMLHttpRequest();
  req.addEventListener('load', function () {
    let res = JSON.parse(this.responseText);
    document.title = res.title;
    document.getElementById('heading').textContent = res.heading;
    document.getElementById('join').href = res.link;
    if(res.info.track !== '' && res.info.session !== '') {
      document.getElementById('session').textContent = res.info.session + ' @ ' + res.info.track;
      updatePhase(res.info.phase);
    } else if(res.info.track !== '') {
      document.getElementById('session').textContent = res.info.track;
      updatePhase(null);
    }
    setRemainingTime(res.info.currtime, res.info.endtime);
    hltable = document.getElementById('hotlaps').getElementsByTagName('tbody')[0];
    buildHotlapsTable(hotlaps2List(res.data));
    if(typeof res.info.drivers !== "undefined" && res.info.drivers !== null) {
      buildLiveTable(drivers2List(res.info.drivers));
    } else
      ;//document.getElementById('live').style['display'] = 'none';
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
        t.ai = data[name][vehclass][veh].ai;
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
    t.ai = data[name].ai;
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
    //document.getElementById('live').style['display'] = 'none';
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
  if(lap.ai)
    e.setAttribute('ai', 'true');
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
}

function buildHotlapsTable(laps) {
  for(let i = 0; i < laps.length; i++)
    hltable.appendChild(createHotlapsElement(laps[i]));
  sortHotlapsTable();
}

function buildLiveTable(drivers) {
  let t = '';
  for(let i = 0; i < drivers.length; i++) {
    t += '<tr';
    if(i % 2 != 0)
      t += ' class="even"';
    if(drivers[i].ai)
      t += ' ai="true"';
    t += '>';
    t += '<td>' + (i + 1) + '</td>';
    t += '<td>' + drivers[i].name + '</td>';
    t += '<td>' + drivers[i].veh + '</td>';
    t += '<td>' + drivers[i].vehclass + '</td></tr>';
  }
  document.getElementById('live').getElementsByTagName('tbody')[0].innerHTML = t;
}

function setRemainingTime(currtime, endtime) {
  if(endtime !== null) {
    rtime = endtime - currtime;
    timelastset = new Date();
    clearInterval(rtimeinterval);
    rtimeinterval = setInterval(updateRemainingTime, 1000);
    updateRemainingTime();
    document.getElementById('rtime').style.display = '';
  } else {
    clearInterval(rtimeinterval);
    document.getElementById('rtime').style.display = 'none';
  }
}

function updateRemainingTime() {
  let t = rtime - Math.floor((new Date()-timelastset)/1000);
  if(t < 0) {
    t = 0;
    clearInterval(rtimeinterval);
  }
  let hours = Math.floor(t/3600);
  let minutes = Math.floor((t - hours*3600)/60);
  let seconds = Math.floor(t % 60);
  let str = '';
  if(hours != 0)
    str += hours + ':';
  if(minutes < 10)
    str += '0' + minutes + ':';
  else
    str += minutes + ':';
  if(seconds < 10)
    str += '0' + seconds;
  else
    str += seconds;
  document.getElementById('rtime').textContent = str;
}

function updatePhase(phase) {
  if(phase === null) {
    document.getElementById('phase').textContent = 'Server Offline';
    document.getElementById('sectors').style.display = 'none';
  } else {
    document.getElementById('sectors').style.display = '';
    if(phase.name == 'FCY')
      document.getElementById('phase').textContent = phase.name + ' (' +  phase.yellow + ')';
    else
      document.getElementById('phase').textContent = phase.name;
    for(let i = 0; i < 3; i++) {
      if(phase.sectors[i] !== 11)
        document.getElementById('sectors').children[i].className = 'yellow';
      else
        document.getElementById('sectors').children[i].className = '';
    }
  }
}
