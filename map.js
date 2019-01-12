var socket = io('/map');
var canvas;
var context;
var track;
var classcolors;
var colors = ['red', 'blue', 'lime', 'yellow', 'magenta', 'aqua', 'orange', 'white', 'gray', 'silver'];

socket.on('veh', function (veh) {
  context.clearRect(0, 0, canvas.width, canvas.height);
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

  let fillcolor, textcolor;
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
    context.strokeStyle = 'black';
    context.fillStyle = fillcolor;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(veh[num].x+500, 500-veh[num].y, 10, 0, Math.PI * 2, true);
    context.stroke();
    context.fill();
    context.fillStyle = textcolor;
    context.font = '12px serif';
    context.textAlign = 'center';
    context.fillText(num, veh[num].x+500, 500-veh[num].y+4);
  });
});

socket.on('map', function (map) {
  track = map;
});

socket.on('classes', function (colors) {
  if(typeof classcolors !== "undefined")
    classcolors = new Object();
  else
    classcolors = colors;
});

document.addEventListener('DOMContentLoaded', initLoad, false);
function initLoad(e) {
  canvas = document.getElementById('map');
  context = canvas.getContext('2d');
}

function drawSector(sector, end, color) {
  context.strokeStyle = color;
    context.beginPath();
    for(let i = 0; i < sector.length; i++)
      context.lineTo(sector[i].x+500, 500-sector[i].y);
    context.lineTo(end.x+500, 500-end.y);
    context.stroke();
}

function drawSectorMarker(prev, center, next) {
  let angle = -1*Math.atan2(next.y - prev.y, next.x - prev.x);
  context.save();
  context.translate(center.x+500, 500-center.y);
  context.rotate(angle);
  context.translate(-1*(center.x+500), -1*(500-center.y));
  context.fillRect(center.x+500-3, 500-center.y-15, 6, 30);
  context.restore();
}
