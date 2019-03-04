var ltable;
var classbests = new Object();
var sortcol = 7;

document.addEventListener('DOMContentLoaded', initLoad, false);
document.addEventListener('DOMContentLoaded', getTracks, false);

function initLoad(e) {
  ltable = document.getElementById('laps').getElementsByTagName('tbody')[0];
}

function getTracks(e) {
  let req = new XMLHttpRequest();
  req.addEventListener('load', function () {
    let res = JSON.parse(this.responseText);
    if(res.current == null && res.tracks.length == 0) {
      document.title = 'Best Laps';
    } else if(res.current == null) {
      setTrack(res.tracks[0]);
    } else {
      setTrack(res.current);
    }
  });
  req.open('GET', '/tracks');
  req.send();
}

function setTrack(t) {
  document.title = t + ' Best Laps';
  document.getElementById('track').textContent = t;
  getLaps(t);
}

function getLaps(t) {
  let req = new XMLHttpRequest();
  req.addEventListener('load', function () {
    let res = JSON.parse(this.responseText);
    buildLapsTable(laps2List(res));
  });
  req.open('GET', '/laptimes?t=' + encodeURIComponent(t));
  req.send();
}

function laps2List(data) {
  let list = [];
  Object.keys(data).forEach(function(name, index) {
    Object.keys(data[name]).forEach(function(vehclass, index) {
      Object.keys(data[name][vehclass]).forEach(function(veh, index) {
        let t = new Object();
        t.name = name;
        t.vehclass = vehclass;
        t.veh = veh;
        t.bestlap = data[name][vehclass][veh].lap;
        t.sectors = data[name][vehclass][veh].sectors;
        t.ai = data[name][vehclass][veh].ai;
        list.push(t);
      });
    });
  });
  return list;
}

function createLapsElement(lap) {
  let e = document.createElement('tr');
  let t = '';
  t += '<td></td>';
  t += '<td></td>';
  t += '<td></td>';
  t += '<td></td>';
  if(lap.bestlap.s1 == undefined)
    t += '<td class="time">-</td>';
  else
    t += '<td class="time">' + secToTime(lap.bestlap.s1) + '</td>';
  if(lap.bestlap.s2 == undefined)
    t += '<td class="time">-</td>';
  else
    t += '<td class="time">' + secToTime(lap.bestlap.s2) + '</td>';
  if(lap.bestlap.s3 == undefined)
    t += '<td class="time">-</td>';
  else
    t += '<td class="time">' + secToTime(lap.bestlap.s3) + '</td>';
  t += '<td class="time">' + secToTime(lap.bestlap.t) + '</td>';
  if(lap.sectors.s1 == undefined)
    t += '<td class="time">-</td>';
  else
    t += '<td class="time">' + secToTime(lap.sectors.s1) + '</td>';
  if(lap.sectors.s2 == undefined)
    t += '<td class="time">-</td>';
  else
    t += '<td class="time">' + secToTime(lap.sectors.s2) + '</td>';
  if(lap.sectors.s3 == undefined)
    t += '<td class="time">-</td>';
  else
    t += '<td class="time">' + secToTime(lap.sectors.s3) + '</td>';
  t += '<td class="time">' + secToTime(lap.sectors.s1 + lap.sectors.s2 + lap.sectors.s3) + '</td>';
  t += '<td>' + new Date(lap.bestlap.timestamp).toUTCString() + '</td>';
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

function sortLapsTable() {
  let list = Array.from(ltable.children).sort(compareLaps);
  for(let i = 0; i < list.length; i++) {
    list[i].firstElementChild.textContent = i+1;
    if(i % 2 != 0)
      list[i].classList.add('even');
    else
      list[i].classList.remove('even');
    let c = list[i].children[3].textContent;
    if(typeof classbests[c] === "undefined" || classbests[c] > Number.parseFloat(list[i].children[7].textContent))
      classbests[c] = Number.parseFloat(list[i].children[7].textContent);
    ltable.appendChild(list[i]);
  }
  console.log(classbests);
}

function buildLapsTable(laps) {
  for(let i = 0; i < laps.length; i++)
    ltable.appendChild(createLapsElement(laps[i]));
  sortLapsTable();
}

function compareLaps(a, b) {
  let at = Number.parseFloat(a.children[sortcol].textContent);
  let bt = Number.parseFloat(b.children[sortcol].textContent);
  if (at < bt)
    return -1;
  if (at > bt)
    return 1;
  return 0;
}