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
    context.strokeStyle = 'navy';
    context.beginPath();
    for(let i = 0; i < track.s1.length; i++)
      context.lineTo(track.s1[i].x+500, 500-track.s1[i].y);
    context.lineTo(track.s2[0].x+500, 500-track.s2[0].y);
    context.stroke();
    context.strokeStyle = 'green';
    context.beginPath();
    for(let i = 0; i < track.s2.length; i++)
      context.lineTo(track.s2[i].x+500, 500-track.s2[i].y);
    context.lineTo(track.s3[0].x+500, 500-track.s3[0].y);
    context.stroke();
    context.strokeStyle = 'maroon';
    context.beginPath();
    for(let i = 0; i < track.s3.length; i++)
      context.lineTo(track.s3[i].x+500, 500-track.s3[i].y);
    context.lineTo(track.s1[0].x+500, 500-track.s1[0].y);
    context.stroke();
    
    context.fillStyle = 'gray';
    let angle;
    angle = -1*Math.atan2(track.s1[1].y - track.s3[track.s3.length-1].y, track.s1[1].x - track.s3[track.s3.length-1].x);
    context.save();
    context.translate(track.s1[0].x+500, 500-track.s1[0].y);
    context.rotate(angle);
    context.translate((track.s1[0].x+500)*-1, (500-track.s1[0].y)*-1);
    context.fillRect(track.s1[0].x+500-3, 500-track.s1[0].y-15, 6, 30);
    context.restore();
    angle = -1*Math.atan2(track.s2[1].y - track.s1[track.s1.length-1].y, track.s2[1].x - track.s1[track.s1.length-1].x);
    context.save();
    context.translate(track.s2[0].x+500, 500-track.s2[0].y);
    context.rotate(angle);
    context.translate((track.s2[0].x+500)*-1, (500-track.s2[0].y)*-1);
    context.fillRect(track.s2[0].x+500-3, 500-track.s2[0].y-15, 6, 30);
    context.restore();
    angle = -1*Math.atan2(track.s3[1].y - track.s2[track.s2.length-1].y, track.s3[1].x - track.s2[track.s2.length-1].x);
    context.save();
    context.translate(track.s3[0].x+500, 500-track.s3[0].y);
    context.rotate(angle);
    context.translate((track.s3[0].x+500)*-1, (500-track.s3[0].y)*-1);
    context.fillRect(track.s3[0].x+500-3, 500-track.s3[0].y-15, 6, 30);
    context.restore();
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
    //context.fillStyle = 'white';
    context.fillStyle = fillcolor;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(veh[num].x+500, 500-veh[num].y, 10, 0, Math.PI * 2, true);
    context.stroke();
    context.fill();
    //context.fillStyle = 'black';
    context.fillStyle = textcolor;
    context.font = '12px serif';
    context.textAlign = 'center';
    context.fillText(num, veh[num].x+500, 500-veh[num].y+4);
  });
});

socket.on('map', function (map) {
  console.log('got');
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
