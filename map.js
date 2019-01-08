var socket = io('/map');
var canvas;
var context;

socket.on('map', function (veh) {
  //console.log(Object.keys(veh).length);
  /*for(let i = 0; i < Object.keys(veh).length; i++) {
    console.log(veh[i].x + ',' + veh[i].y);
    ctx.fillStyle = 'green';
    ctx.fillRect(veh[i].x, veh[i].y, veh[i].x+10, veh[i].y+10);
  }*/
  context.clearRect(0, 0, canvas.width, canvas.height);
  Object.keys(veh).slice().reverse().forEach(function(num, index) {
    //console.log(veh[num].x + ',' + veh[num].y);
    //context.fillStyle = 'green';
    //context.fillRect(veh[num].x+500, 500-veh[num].y, 10, 10);
    context.fillStyle = 'white';
    context.beginPath();
    context.arc(veh[num].x+500, 500-veh[num].y, 10, 0, Math.PI * 2, true); // Outer circle
    context.stroke();
    context.fill();
    context.fillStyle = 'black';
    context.font = '12px serif';
    context.textAlign = 'center';
    context.fillText(num, veh[num].x+500, 500-veh[num].y+4);
  });
});

document.addEventListener('DOMContentLoaded', initLoad, false);
function initLoad(e) {
  canvas = document.getElementById('map');
  context = canvas.getContext('2d');
}
