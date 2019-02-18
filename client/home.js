var hltable;
var livetable;
var hclassbests = new Object();
var sessionbests = null;
var newupdates = [];
var lapcolumn = 10;
var chatatbottom = true;

socket.emit('join', 'hotlaps');
socket.emit('join', 'live');
socket.emit('join', 'chat');

socket.on('hotlap', function (laps) {
  updateHotlapsTable(laps);
  sortHotlapsTable();
  for(let i = 0; i < newupdates.length; i++) {
    if(Number.parseFloat(newupdates[i].children[7].textContent) == hclassbests[newupdates[i].children[3].textContent]) {
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

socket.on('vehs', function (vehs) {
  updateLiveTable(vehs);
  sortLiveTable();
  if(vehs.length > 0)
    updateRemainingLaps(Number.parseInt(livetable.firstElementChild.children[lapcolumn].textContent)+1);
  else
    updateRemainingLaps();
});

socket.on('bests', function (bests) {
  sessionbests = bests;
});

socket.on('message', function (messages) {
  let m = document.getElementById('messages');
  chatatbottom = m.scrollHeight - m.clientHeight <= m.scrollTop + 1
  for(let i = 0; i < messages.length; i++) {
    let e = document.createElement('p');
    e.textContent = messages[i];
    m.appendChild(e);
  }
  if(chatatbottom) {
    m.scrollTop = m.scrollHeight - m.clientHeight
  }
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
    if(res.info.session.startsWith('Race'))
      maxlaps = res.info.maxlaps;
    else
      maxlaps = null;
    hltable = document.getElementById('hotlaps').getElementsByTagName('tbody')[0];
    livetable = document.getElementById('live').getElementsByTagName('tbody')[0];
    buildHotlapsTable(hotlaps2List(res.data));
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

function compareHotlaps(a, b) {
  let at = Number.parseFloat(a.children[7].textContent);
  let bt = Number.parseFloat(b.children[7].textContent);
  if (at < bt)
    return -1;
  if (at > bt)
    return 1;
  return 0;
}

function compareVehs(a, b) {
  let ap = Number.parseInt(a.children[0].textContent);
  let bp = Number.parseInt(b.children[0].textContent);
  if (ap < bp)
    return -1;
  if (ap > bp)
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
    found = false;
  }
}

function createHotlapsElement(lap) {
  let e = document.createElement('tr');
  let t = '';
  t += '<td></td>';
  t += '<td></td>';
  t += '<td></td>';
  t += '<td></td>';
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
  e.children[1].textContent = lap.name;
  e.children[1].title = lap.name;
  e.children[2].textContent = lap.veh;
  e.children[2].title = lap.veh;
  e.children[3].textContent = lap.vehclass;
  e.children[3].title = lap.vehclass;
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
    if(typeof hclassbests[c] === "undefined" || hclassbests[c] > Number.parseFloat(list[i].children[7].textContent))
      hclassbests[c] = Number.parseFloat(list[i].children[7].textContent);
    hltable.appendChild(list[i]);
  }
}

function buildHotlapsTable(laps) {
  for(let i = 0; i < laps.length; i++)
    hltable.appendChild(createHotlapsElement(laps[i]));
  sortHotlapsTable();
}

function updateLiveTable(vehs) {
  let found = false;
  let oldfound = new Array(livetable.children.length).fill(false);
  for(let i = 0; i < vehs.length; i++) {
    for(let j = 0; j < livetable.children.length; j++) {
      if(livetable.children[j].children[1].textContent == vehs[i].drivername && livetable.children[j].children[3].textContent == vehs[i].vehclass && livetable.children[j].children[2].textContent == vehs[i].vehname) {
        updateLiveTableElement(livetable.children[j], vehs[i]);
        found = true;
        oldfound[j] = true;
        break;
      }
    }
    if(!found) {
      let temp = createLiveElement(vehs[i]);
      livetable.appendChild(temp);
    }
    found = false;
  }
  for(let i = oldfound.length-1; i >= 0; i--) {
    if(!oldfound[i])
      livetable.removeChild(livetable.children[i]);
  }
}

function highlightBests(el) {
  if(typeof sessionbests.pb[el.children[1].textContent] !== 'undefined') {
    if(typeof sessionbests.pb[el.children[1].textContent][el.children[3].textContent] !== 'undefined') {
      let b = sessionbests.pb[el.children[1].textContent][el.children[3].textContent][el.children[2].textContent];
      let c = sessionbests.cb[el.children[3].textContent];
      if(typeof b !== 'undefined') {
        if(el.children[5].textContent == b.s1.toFixed(3)) {
          if(el.children[5].textContent == c.s1.toFixed(3))
            el.children[5].className = 'cbtime';
          else
            el.children[5].className = 'pbtime';
        } else
          el.children[5].className = '';
        if(el.children[6].textContent == b.s2.toFixed(3)) {
          if(el.children[6].textContent == c.s2.toFixed(3))
            el.children[6].className = 'cbtime';
          else
            el.children[6].className = 'pbtime';
        } else
          el.children[6].className = '';
        if(el.children[7].textContent == b.s3.toFixed(3)) {
          if(el.children[7].textContent == c.s3.toFixed(3))
            el.children[7].className = 'cbtime';
          else
            el.children[7].className = 'pbtime';
        } else
          el.children[7].className = '';
        if(el.children[8].textContent == b.t.toFixed(3)) {
          if(el.children[8].textContent == c.t.toFixed(3))
            el.children[8].className = 'cbtime';
          else
            el.children[8].className = 'pbtime';
        } else
          el.children[8].className = '';
        if(el.children[9].textContent == c.t.toFixed(3)) {
          el.children[9].className = 'cbtime';
        } else
          el.children[9].className = '';
      }
    }
  }
}

function updateLiveTableElement(el, veh) {
  el.children[0].textContent = veh.place;
  if(veh.timebehindleader != 0)
    el.children[4].textContent = veh.timebehindleader.toFixed(3);
  else
    el.children[4].textContent = '';
  if(veh.currs1 <= 0 && veh.currs2 <= 0) {
    if(veh.lasts1 <= 0) {
      el.children[5].textContent = '';
      el.children[6].textContent = '';
      el.children[7].textContent = '';
    } else if(veh.lasts2 <= 0) {
      el.children[5].textContent = veh.lasts1.toFixed(3);
      el.children[6].textContent = '';
      el.children[7].textContent = '';
    } else if(veh.lastlap <= 0) {
      el.children[5].textContent = veh.lasts1.toFixed(3);
      el.children[6].textContent = (veh.lasts2-veh.lasts1).toFixed(3);
      el.children[7].textContent = '';
    } else {
      el.children[5].textContent = veh.lasts1.toFixed(3);
      el.children[6].textContent = (veh.lasts2-veh.lasts1).toFixed(3);
      el.children[7].textContent = (veh.lastlap-veh.lasts2).toFixed(3);
    }
  } else {
    if(veh.currs1 > 0)
      el.children[5].textContent = veh.currs1.toFixed(3);
    if(veh.currs2 > 0)
      el.children[6].textContent = (veh.currs2-veh.currs1).toFixed(3);
    else
      el.children[6].textContent = '';
    el.children[7].textContent = '';
  }
  if(veh.lastlap > 0)
    el.children[8].textContent = veh.lastlap.toFixed(3);
  else
    el.children[8].textContent = '';
  if(veh.bestlap > 0)
    el.children[9].textContent = veh.bestlap.toFixed(3);
  else
    el.children[9].textContent = '';
  el.children[10].textContent = veh.laps;
  let status = '';
  if(veh.status == 0) {
    if(veh.inpit)
      status = 'Pit';
    else if(veh.sector == 0)
      status = 'S3';
    else if(veh.sector == 1)
      status = 'S1';
    else if(veh.sector == 2)
      status = 'S2';
  } else if(veh.status == 1)
    status = 'Finish';
  else if(veh.status == 2)
    status = 'DNF';
  else if(veh.status == 3)
    status = 'DQ';
  el.children[11].textContent = status;
  if(sessionbests != null)
    highlightBests(el);
}

function createLiveElement(veh) {
  let e = document.createElement('tr');
  let t = '';
  t += '<td>' + veh.place + '</td>';
  t += '<td></td>';
  t += '<td></td>';
  t += '<td></td>';
  t += '<td class="time"></td>';
  t += '<td class="time"></td>';
  t += '<td class="time"></td>';
  t += '<td class="time"></td>';
  t += '<td class="time"></td>';
  t += '<td class="time"></td>';
  t += '<td>' + veh.laps + '</td>';
  t += '<td></td>';
  e.innerHTML = t;
  if(veh.isAI)
    e.setAttribute('ai', 'true');
  e.children[1].textContent = veh.drivername;
  e.children[1].title = veh.drivername;
  e.children[2].textContent = veh.vehname;
  e.children[2].title = veh.vehname;
  e.children[3].textContent = veh.vehclass;
  e.children[3].title = veh.vehclass;
  return e;
}

function sortLiveTable() {
  let list = Array.from(livetable.children).sort(compareVehs);
  for(let i = 0; i < list.length; i++) {
    if(i % 2 != 0)
      list[i].classList.add('even');
    else
      list[i].classList.remove('even');
    livetable.appendChild(list[i]);
  }
}

function buildLiveTable(vehs) {
  for(let i = 0; i < vehs.length; i++) {
    livetable.appendChild(createLiveElement(vehs[i]));
  }
  sortHotlapsTable();
}
