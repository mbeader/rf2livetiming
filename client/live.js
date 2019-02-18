var livetable;
var sessionbests = null;
var lapcolumn = 10;

socket.emit('join', 'live');

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
    livetable = document.getElementById('live').getElementsByTagName('tbody')[0];
  });
  req.open('GET', '/init');
  req.send();
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
