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
		if(document.location.pathname != '/map') {
			let join = document.getElementById('join');
			if(join) {
				if(res.ip && res.port && res.game) {
					join.href = 'steam://run/' + res.game + '//+connect ' + res.ip + ':' + res.port;
					join.removeAttribute('class');
				} else {
					join.removeAttribute('href');
					join.setAttribute('class', 'hidden');
				}
			}
		}
	});
	req.open('GET', 'info');
	req.send();
}
