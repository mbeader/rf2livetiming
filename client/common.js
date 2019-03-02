var socket = io('/');

socket.on('refresh', function () {
  location.reload(true);
});

document.addEventListener('DOMContentLoaded', getInfo, false);
function getInfo(e) {
  let req = new XMLHttpRequest();
  req.addEventListener('load', function () {
    let res = JSON.parse(this.responseText);
    let t;
    switch(document.location.pathname) {
      case '/':
      case '/index.html':
        t = ' Home';
        break;
      case '/live':
        t = ' Live Timing';
        break;
      case '/map':
        t = ' Track Map'
        break;
      default:
        t = '';
    }
    if(res.name == null) {
      document.title = t.trim();
      document.getElementById('heading').textContent = 'No active server';
    } else {
      document.title = res.name + t;
      document.getElementById('heading').textContent = res.name;
    }
    if(res.ip != null && res.port != null)
      document.getElementById('join').href = 'steam://run/365960//+connect ' + res.ip + ':' + res.port;
    else
      document.getElementById('join').href = '';
  });
  req.open('GET', '/info');
  req.send();
}

function secToTime(t) {
  let minutes = Math.floor(t/60);
  let seconds = (t % 60).toFixed(3);
  let str = '';
  if(minutes != 0)
    str += minutes + ':';
  if(minutes != 0 && seconds < 10)
    str += '0' + seconds;
  else
    str += seconds;
  return str;
}
