//var socket = io('/map');
var canvas;
var context;
var track;
var dy, dx, cy = 0, cx = 0;
var dim, scalefactor = 1;
var classcolors;
var colors = ['red', 'blue', 'lime', 'yellow', 'magenta', 'aqua', 'orange', 'white', 'gray', 'silver'];
var edges = {maxx: Number.MIN_SAFE_INTEGER, minx: Number.MAX_SAFE_INTEGER, maxy: Number.MIN_SAFE_INTEGER, miny: Number.MAX_SAFE_INTEGER};

socket.emit('join', 'map');

socket.on('veh', function (veh) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawTrack();

  let fillcolor, textcolor;
  let changed = false;
  Object.keys(veh).slice().reverse().forEach(function(num, index) {
    if(typeof classcolors[veh[num].c] !== "undefined") {
      fillcolor = classcolors[veh[num].c].color;
      textcolor = classcolors[veh[num].c].text;
    } else {
      let i = Object.keys(classcolors).length % 10;
      fillcolor = colors[i];
      if(i == 1 || i == 4 || i == 8)
        textcolor = 'white';
      else
        textcolor = 'black';
      classcolors[veh[num].c] =  new Object();
      classcolors[veh[num].c].color = fillcolor;
      classcolors[veh[num].c].text = textcolor;
    }
    if(typeof track === "undefined") {
      if(edges.maxx < veh[num].x) {
        edges.maxx = veh[num].x;
        changed = true;
      } else if(edges.minx > veh[num].x) {
        edges.minx = veh[num].x;
        changed = true;
      } if(edges.maxy < veh[num].y) {
        edges.maxy = veh[num].y;
        changed = true;
      } else if(edges.miny > veh[num].y) {
        edges.miny = veh[num].y;
        changed = true;
      }
    }
    context.strokeStyle = 'black';
    context.fillStyle = fillcolor;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(veh[num].x+dim-cx, dim-veh[num].y+cy, 10, 0, Math.PI * 2, true);
    context.stroke();
    context.fill();
    context.fillStyle = textcolor;
    context.font = '12px serif';
    context.textAlign = 'center';
    context.fillText(num, veh[num].x+dim-cx, dim-veh[num].y+cy+4);
  });
  if(changed) {
    cx = (edges.maxx + edges.minx)/2;
    cy = (edges.maxy + edges.miny)/2;
  }
});

socket.on('map', function (map) {
  track = map;
  dx = track.maxx - track.minx;
  dy = track.maxy - track.miny;
  cx = (track.maxx + track.minx)/2;
  cy = (track.maxy + track.miny)/2;
  calcScaleFactor();
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawTrack();
});

socket.on('clear', function () {
  context.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('classes', function (colors) {
  if(typeof classcolors !== "undefined")
    classcolors = new Object();
  else
    classcolors = colors;
});

document.addEventListener('DOMContentLoaded', initMapLoad, false);
function initMapLoad(e) {
  canvas = document.getElementById('map');
  context = canvas.getContext('2d');
  dim = canvas.width/2;
  canvas.style.width = document.getElementById('map-wrapper').offsetWidth + 'px';
}

function drawTrack() {
  if(typeof track !== "undefined") {
    context.lineWidth = 15;
    drawSector(track.s1, track.s2[0], 'navy');
    drawSector(track.s2, track.s3[0], 'green');
    drawSector(track.s3, track.s1[0], 'maroon');
    
    context.fillStyle = 'gray';
    drawSectorMarker(track.s3[track.s3.length-1], track.s1[0], track.s1[1]);
    drawSectorMarker(track.s1[track.s1.length-1], track.s2[0], track.s2[1]);
    drawSectorMarker(track.s2[track.s2.length-1], track.s3[0], track.s3[1]);
  }
}

function drawSector(sector, end, color) {
  context.strokeStyle = color;
    context.beginPath();
    for(let i = 0; i < sector.length; i++)
      context.lineTo(sector[i].x+dim-cx, dim-sector[i].y+cy);
    context.lineTo(end.x+dim-cx, dim-end.y+cy);
    context.stroke();
}

function drawSectorMarker(prev, center, next) {
  let angle = -1*Math.atan2(next.y - prev.y, next.x - prev.x);
  context.save();
  context.translate(center.x+dim-cx, dim-center.y+cy);
  context.rotate(angle);
  context.translate(-1*(center.x+dim-cx), -1*(dim-center.y+cy));
  context.fillRect(center.x+dim-cx-3, dim-center.y+cy-15, 6, 30);
  context.restore();
}

function calcScaleFactor() {
  if(dx > dy)
    scalefactor = (canvas.width*.8)/dx;
  else
    scalefactor = (canvas.height*.8)/dy;
}
