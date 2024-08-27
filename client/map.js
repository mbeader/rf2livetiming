var canvas;
var context;
var track;
var dy, dx, cy = 0, cx = 0;
var dim, scalefactor = 1;
var scaled = new Object();
var classcolors;
var colors = ['red', 'blue', 'lime', 'yellow', 'magenta', 'aqua', 'orange', 'white', 'gray', 'silver'];
var edges = {maxx: Number.MIN_SAFE_INTEGER, minx: Number.MAX_SAFE_INTEGER, maxy: Number.MIN_SAFE_INTEGER, miny: Number.MAX_SAFE_INTEGER};
var staticcanvas = new Object();
staticcanvas.canvas = document.createElement('canvas');
staticcanvas.context = staticcanvas.canvas.getContext('2d');

socket.emit('join', 'map');

socket.on('veh', function (veh) {
	context.clearRect(0, 0, canvas.width, canvas.height);
	context.drawImage(staticcanvas.canvas, 0, 0);

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
			classcolors[veh[num].c] =	new Object();
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
		let x = calcX(veh[num].x-cx);
		let y = calcY(-1*veh[num].y+cy);
		context.strokeStyle = 'black';
		context.fillStyle = fillcolor;
		context.lineWidth = 2;
		context.beginPath();
		context.arc(x, y, 10, 0, Math.PI * 2, true);
		context.stroke();
		context.fill();
		context.fillStyle = textcolor;
		context.font = '12px serif';
		context.textAlign = 'center';
		context.fillText(num, x, y+4);
	});
	if(changed) {
		dx = edges.maxx - edges.minx;
		dy = edges.maxy - edges.miny;
		cx = (edges.maxx + edges.minx)/2;
		cy = (edges.maxy + edges.miny)/2;
		calcScaleFactor(dx, dy);
	}
});

socket.on('map', function (map) {
	track = map;
	let orig = new Object();
	Object.assign(map, orig);
	track.orig = orig;
	dx = track.maxx - track.minx;
	dy = track.maxy - track.miny;
	cx = (track.maxx + track.minx)/2;
	cy = (track.maxy + track.miny)/2;
	processTrack(track);
	calcScaleFactor(dx, dy);
	context.clearRect(0, 0, canvas.width, canvas.height);
	drawTrack();
});

socket.on('clear', function () {
	context.clearRect(0, 0, canvas.width, canvas.height);
	staticcanvas.context.clearRect(0, 0, canvas.width, canvas.height);
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
	if(window.location.pathname == '/map') {
		resizeMapMap();
		window.addEventListener('resize', resizeMapMap, true);
	} else {
		resizeMapHome();
		window.addEventListener('resize', resizeMapHome, true);
	}
	staticcanvas.canvas.width = canvas.width;
	staticcanvas.canvas.height = canvas.height;
	staticcanvas.context = staticcanvas.canvas.getContext('2d');
}

function processTrack(track) {
	let sectors = [ track.s1, track.s2, track.s3 ];
	for(let i = 0; i < sectors.length; i++) {
		processPoints(sectors[i]);
	}
	track.maxx = track.s1[0].x;
	track.minx = track.s1[0].x;
	track.maxy = track.s1[0].y;
	track.miny = track.s1[0].y;
	for(let i = 0; i < sectors.length; i++) {
		recalcSectorLimits(track, sectors[i]);
	}
}

function processPoints(sector) {
	for(let i = 0; i < sector.length; i++)
		processPoint(sector[i]);
}

function processPoint(point) {
	point.x -= cx;
	point.y *= -1;
	point.y += cy;
}

function recalcSectorLimits(track, sector) {
	for(let i = 0; i < sector.length; i++) {
		if(sector[i].x > track.maxx)
			track.maxx = sector[i].x;
		else if(sector[i].x < track.minx)
			track.minx = sector[i].x;
		if(sector[i].y > track.maxy)
			track.maxy = sector[i].y;
		else if(sector[i].y < track.miny)
			track.miny = sector[i].y;
	}
}

function resizeMapMap() {
	let tempwidth = document.getElementById('map-wrapper').offsetWidth;
	if(document.documentElement.scrollHeight > document.documentElement.clientHeight)
		while(document.documentElement.scrollHeight > document.documentElement.clientHeight)
			canvas.height--;
	else {
		do {
			canvas.height++;
		} while(document.documentElement.scrollHeight == document.documentElement.clientHeight);
	}
	let size = tempwidth > canvas.height ? canvas.height : tempwidth;
	resizeMap(size, size);
}

function resizeMapHome() {
	resizeMap(document.getElementById('map-wrapper').offsetWidth, canvas.width > 400 ? 400 : canvas.width);
}

function resizeMap(width, height) {
	canvas.width = width;
	canvas.height = height;
	staticcanvas.canvas.width = canvas.width;
	staticcanvas.canvas.height = canvas.height;
	dim = canvas.height/2;
	if(typeof track !== "undefined") {
		calcScaleFactor(dx, dy);
		drawTrack();
	}
}

function drawTrack() {
	staticcanvas.context.clearRect(0, 0, canvas.width, canvas.height);
	if(typeof track !== "undefined") {
		staticcanvas.context.lineWidth = 15;
		drawSector(track.s1, track.s2[0], 'navy');
		drawSector(track.s2, track.s3[0], 'green');
		drawSector(track.s3, track.s1[0], 'maroon');

		drawChevrons(track);

		drawSectorMarker(track.s3[track.s3.length-1], track.s1[0], track.s1[1], 'white', 'black');
		drawSectorMarker(track.s1[track.s1.length-1], track.s2[0], track.s2[1], 'gray');
		drawSectorMarker(track.s2[track.s2.length-1], track.s3[0], track.s3[1], 'gray');
	}
	context.drawImage(staticcanvas.canvas, 0, 0);
}

function drawSector(sector, end, color) {
	staticcanvas.context.strokeStyle = color;
	staticcanvas.context.beginPath();
	for(let i = 0; i < sector.length; i++)
		staticcanvas.context.lineTo(...calcPoint(sector[i].x, sector[i].y));
	staticcanvas.context.lineTo(...calcPoint(end.x, end.y));
	staticcanvas.context.stroke();
}

function drawChevrons(track) {
	staticcanvas.context.fillStyle = 'rgba(191, 191, 191, 0.7)';
	drawChevron(track.s3[track.s3.length-1], track.s1[0], track.s1[1], 10);
	drawChevron(track.s3[track.s3.length-1], track.s1[0], track.s1[1], -10);
}

function drawChevron(prev, center, next, offset) {
	let width = 10, height = 10;
	let baseangle = Math.atan2(next.y - prev.y, next.x - prev.x);
	let angle = baseangle+Math.PI/2;
	let point = { x: calcX(center.x), y: calcY(center.y) };
	point.x += Math.cos(baseangle)*offset;
	point.y += Math.sin(baseangle)*offset;
	staticcanvas.context.save();
	staticcanvas.context.translate(point.x, point.y);
	staticcanvas.context.rotate(angle);
	staticcanvas.context.translate(-1*point.x, -1*point.y);
	staticcanvas.context.beginPath();
	staticcanvas.context.lineTo(point.x-width/2, point.y+height/2);
	staticcanvas.context.lineTo(point.x-width/2, point.y);
	staticcanvas.context.lineTo(point.x, point.y-height/2);
	staticcanvas.context.lineTo(point.x+width/2, point.y);
	staticcanvas.context.lineTo(point.x+width/2, point.y+height/2);
	staticcanvas.context.lineTo(point.x, point.y);
	staticcanvas.context.fill();
	staticcanvas.context.restore();
}

function drawSectorMarker(prev, center, next, primary, secondary) {
	let angle = Math.atan2(next.y - prev.y, next.x - prev.x);
	let point = { x: calcX(center.x), y: calcY(center.y) };
	let length = 30, width = 6;
	let xoffset = width/2, yoffset = length/2;
	staticcanvas.context.save();
	staticcanvas.context.translate(point.x, point.y);
	staticcanvas.context.rotate(angle);
	staticcanvas.context.translate(-1*point.x, -1*point.y);
	staticcanvas.context.fillStyle = primary;
	staticcanvas.context.fillRect(point.x-xoffset, point.y-yoffset, width, length);
	if(secondary) {
		let rows = 2;
		let cols = length/width*rows, size = width/rows;
		staticcanvas.context.fillStyle = secondary;
		for(let i = 0; i < cols; i++)
			staticcanvas.context.fillRect(point.x-xoffset+(i%2 == 0 ? size : 0), point.y-yoffset+(i*size), size, size);
	}
	staticcanvas.context.restore();
}

function calcPoint(x, y) {
	return [ calcX(x), calcY(y) ];
}

function calcX(x) {
	return x*scalefactor+canvas.width/2;
}

function calcY(y) {
	return y*scalefactor+canvas.height/2;
}

function calcScaleFactor(dx, dy) {
	let multiplier = .8;
	if(dx/dy > canvas.width/canvas.height)
		scalefactor = canvas.width/dx*multiplier;
	else
		scalefactor = canvas.height/dy*multiplier;
	let wx = 0, wy = 0;
	if(canvas.width > canvas.height)
		wx = canvas.width/4;
	else
		wy = canvas.height/2;
	scaled.dx = scalefactor*dx;
	scaled.dy = scalefactor*dy;
	scaled.cx = scalefactor*cx;
	scaled.cy = scalefactor*cy;
}
