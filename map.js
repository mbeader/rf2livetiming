var socket = io('/map');
var canvas;
var context;
var track;

socket.on('veh', function (veh) {
  context.clearRect(0, 0, canvas.width, canvas.height);
  if(typeof track !== "undefined") {
      context.lineWidth = 15;
      context.strokeStyle = 'blue';
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
      context.strokeStyle = 'red';
      context.beginPath();
      for(let i = 0; i < track.s3.length; i++)
        context.lineTo(track.s3[i].x+500, 500-track.s3[i].y);
      context.lineTo(track.s1[0].x+500, 500-track.s1[0].y);
      context.stroke();
    }
  Object.keys(veh).slice().reverse().forEach(function(num, index) {
    context.strokeStyle = 'black';
    context.fillStyle = 'white';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(veh[num].x+500, 500-veh[num].y, 10, 0, Math.PI * 2, true);
    context.stroke();
    context.fill();
    context.fillStyle = 'black';
    context.font = '12px serif';
    context.textAlign = 'center';
    context.fillText(num, veh[num].x+500, 500-veh[num].y+4);
  });
});

socket.on('map', function (map) {
  track = map;
});

document.addEventListener('DOMContentLoaded', initLoad, false);
function initLoad(e) {
  canvas = document.getElementById('map');
  context = canvas.getContext('2d');
}
