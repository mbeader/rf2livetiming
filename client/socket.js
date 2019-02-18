var socket = io('/');

socket.on('refresh', function () {
  location.reload(true);
});
