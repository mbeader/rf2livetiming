const config = require('../config');
var xmlescapes = ['&amp;', '&lt;', '&gt;', '&quot;', '&apos;']
var xmlchars = ['&', '<', '>', '"', '\''];

function parseUDPPacket(msg)	{
	let p = new Object();
	//console.log(msg.toString('hex'));
	// 1-rf2 2-rf1
	p.version = msg.readUInt8(0);
	p.pnum = msg.readUInt8(1);
	p.sequence = msg.readUInt16LE(2);
	p.type = msg.readUInt8(4);
	if(p.type == 2)
		return parseScoringPacket(msg, p);
	else 
		return;
}

function parseScoringPacket(msg, p)	{
	let k;
	let pointer = 5;
	
	p.server = new Object();
	p.server.ip = msg.readUInt32LE(pointer);
	pointer += 4;
	p.server.port = msg.readUInt16LE(pointer);
	pointer += 2;
	for(i = 0; i < pointer + 32; i++)
			if(msg.readUInt8(pointer+i) == 0)
				break;
	p.server.name = msg.toString('ascii', pointer, pointer+i);
	pointer = pointer + i + 1;
	p.server.maxplayers = msg.readUInt32LE(pointer);
	pointer += 4;
	p.server.starttime = msg.readFloatLE(pointer);
	pointer += 4;
	
	for(k = 0; k < pointer + 64; k++)
			if(msg.readUInt8(pointer+k) == 0)
				break;
	p.trackname = msg.toString('ascii', pointer, pointer+k);
	pointer = pointer + k + 1;
	p.sessionid = msg.readUInt32LE(pointer);
	switch(p.sessionid) {
		case 0: p.sessionname = "Test Day";
		break;
		case 1: case 2: case 3: case 4: p.sessionname = "Practice " + p.sessionid;
		break;
		case 5: case 6: case 7: case 8: p.sessionname = "Qualifying " + (p.sessionid - 4);
		break;
		case 9: p.sessionname = "Warmup";
		break;
		case 10: case 11: case 12: case 13: p.sessionname = "Race " + (p.sessionid - 9);
		break;
		default: p.sessionname = "Unknown";
	}
	pointer += 4;
	if(p.version == 2)
		p.currtime = msg.readFloatLE(pointer);
	else
		p.currtime = msg.readDoubleLE(pointer);
	pointer += 8;
	if(p.version == 2)
		p.endtime = msg.readFloatLE(pointer);
	else
		p.endtime = msg.readDoubleLE(pointer);
	if(p.endtime == -2147483648)
		p.endtime = null;
	pointer += 8;
	p.maxlaps = msg.readUInt32LE(pointer);
	if(p.maxlaps == 2147483647)
		p.maxlaps = null;
	pointer += 4;
	if(p.version == 2)
		p.lapdist = msg.readFloatLE(pointer);
	else
		p.lapdist = msg.readDoubleLE(pointer);
	pointer += 8;
	p.numveh = msg.readUInt32LE(pointer);
	pointer += 4;
	p.phase = msg.readUInt8(pointer);
	switch(p.phase) {
		case 0: p.phasename = "Starting";
		break;
		case 1: p.phasename = "Reconnaissance laps";
		break;
		case 2: p.phasename = "Grid";
		break;
		case 3: p.phasename = "Formation lap";
		break;
		case 4: p.phasename = "Countdown";
		break;
		case 5: p.phasename = "Green";
		break;
		case 6: p.phasename = "FCY";
		break;
		case 7: p.phasename = "Session stopped";
		break;
		case 8: p.phasename = "Checkered";
		break;
		case 9: p.phasename = "Paused";
		break;
		default: p.phasename = "Unknown";
	}
	p.yellowstate = msg.readUInt8(++pointer);
	switch(p.yellowstate) {
		case 0: p.yellowname = "None";
		break;
		case 1: p.yellowname = "Pending";
		break;
		case 2: p.yellowname = "Pits closed";
		break;
		case 3: p.yellowname = "Pit lead lap";
		break;
		case 4: p.yellowname = "Pits open";
		break;
		case 5: p.yellowname = "Last lap";
		break;
		case 6: p.yellowname = "Resume";
		break;
		case 7: p.yellowname = "Race halt";
		break;
		case -1: p.yellowname = "Invalid";
		break;
		default: p.yellowname = "Unknown";
	}
	p.sectorflag = [msg.readUInt8(++pointer), msg.readUInt8(++pointer), msg.readUInt8(++pointer)];
	p.startlight = msg.readUInt8(++pointer);
	p.numredlights = msg.readUInt8(++pointer);
	pointer++;
	//console.log(p.sessionname + ' ' + p.startlight + '\t' + p.numredlights);
	p.veh = [];
	for(let i = 0; i < p.numveh; i++) {
		let veh = new Object();
		if(p.version == 2)
			veh.posx = msg.readFloatLE(pointer);
		else
			veh.posx = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.posy = msg.readFloatLE(pointer);
		else
			veh.posy = msg.readDoubleLE(pointer);
		pointer += 8;
		veh.place = msg.readUInt8(pointer++);
		if(p.version == 2)
			veh.lapdist = msg.readFloatLE(pointer);
		else
			veh.lapdist = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.lateralpos = msg.readFloatLE(pointer);
		else
			veh.lateralpos = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.speed = msg.readFloatLE(pointer);
		else
			veh.speed = msg.readDoubleLE(pointer);
		pointer += 8;
		let j = 0;
		for(j = 0; j < pointer + 64; j++)
			if(msg.readUInt8(pointer+j) == 0)
				break;
		veh.vehname = msg.toString('ascii', pointer, pointer+j);
		pointer = pointer + j + 1;
		for(j = 0; j < pointer + 32; j++)
			if(msg.readUInt8(pointer+j) == 0)
				break;
		veh.drivername = msg.toString('ascii', pointer, pointer+j);
		pointer = pointer + j + 1;
		for(j = 0; j < pointer + 32; j++)
			if(msg.readUInt8(pointer+j) == 0)
				break;
		veh.vehclass = msg.toString('ascii', pointer, pointer+j);
		pointer = pointer + j + 1;
		veh.laps = msg.readUInt16LE(pointer);
		pointer += 2;
		if(p.version == 2)
			veh.bests1 = msg.readFloatLE(pointer);
		else
			veh.bests1 = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.bests2 = msg.readFloatLE(pointer);
		else
			veh.bests2 = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.bestlap = msg.readFloatLE(pointer);
		else
			veh.bestlap = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.lasts1 = msg.readFloatLE(pointer);
		else
			veh.lasts1 = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.lasts2 = msg.readFloatLE(pointer);
		else
			veh.lasts2 = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.lastlap = msg.readFloatLE(pointer);
		else
			veh.lastlap = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.currs1 = msg.readFloatLE(pointer);
		else
			veh.currs1 = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.currs2 = msg.readFloatLE(pointer);
		else
			veh.currs2 = msg.readDoubleLE(pointer);
		pointer += 8;
		if(p.version == 2)
			veh.timebehindleader = msg.readFloatLE(pointer);
		else
			veh.timebehindleader = msg.readDoubleLE(pointer);
		pointer += 8;
		veh.lapsbehindleader = msg.readUInt32LE(pointer);
		pointer += 4;
		if(p.version == 2)
			veh.timebehindnext = msg.readFloatLE(pointer);
		else
			veh.timebehindnext = msg.readDoubleLE(pointer);
		pointer += 8;
		veh.lapsbehindnext = msg.readUInt32LE(pointer);
		pointer += 4;
		veh.numpits = msg.readUInt16LE(pointer);
		pointer += 2;
		veh.numpenalties = msg.readUInt16LE(pointer);
		pointer += 2;
		if(msg.readUInt8(pointer++) == 1)
			veh.isAI = true;
		else
			veh.isAI = false;
		veh.inpit = msg.readUInt8(pointer++);
		veh.sector = msg.readUInt8(pointer++);
		veh.status = msg.readUInt8(pointer++);
		p.veh.push(veh);
	}
	pointer += 4;
	p.results = msg.toString('ascii', pointer);
	return p;
}

function parseEventStream(res) {
	let rawevents = res.split('\n');
	let events = {score: [], chat: []};
	// Score, Incident, Chat, Sector
	for(let i = 0; i < rawevents.length; i++) {
		if(rawevents[i].startsWith('<Score'))
			events.score.push(score2Obj(rawevents[i].split('>')[1].split('</Score')[0]));
		else if(rawevents[i].startsWith('<Chat')) {
			let temp = chat2Obj(rawevents[i].split('>')[1].split('</Chat')[0]);
			if(temp !== null)
				events.chat.push(temp);
		}
	}
	return events;
}

function score2Obj(xml) {
	let e = new Object();
	for(let i = 0; i < xmlescapes.length; i++)
		xml = xml.replace(new RegExp(xmlescapes[i], 'gi'), xmlchars[i]);
	if(xml.startsWith('Checkered')) {
	} else {
		e.type = 'sector';
		let endofname = xml.search(/\) lap=/);
		let i = endofname;
		while (xml.charAt(i) != '(')
			i--;
		e.name = xml.slice(0,i);
		let data = xml.slice(endofname+2).split(/( |=)/);
		e.lap = Number.parseInt(data[2]);
		e.point = Number.parseInt(data[6]);
		e.t = Number.parseFloat(data[10]);
		e.et = Number.parseFloat(data[14]);
	}
	return e;
}

function chat2Obj(xml) {
	let e = new Object();
	for(let i = 0; i < xmlescapes.length; i++)
		xml = xml.replace(new RegExp(xmlescapes[i], 'gi'), xmlchars[i]);
	if(xml.charAt(0) == '>') {
		if(xml.charAt(2) == '/')
			return null;
		xml = 'Server:' + xml.substring(1);
	}
	/*else
		e.name = xml.substring(0, xml.indexOf(': '));
	e.message = xml.substring(xml.indexOf(': ')+3);*/
	return xml;
}

function getDriversMap(veh) {
	if(veh.length == 0)
		return;
	let drivers = new Object();
	for(let i = 0; i < veh.length; i++) {
		let vehicle = new Object();
		vehicle.name = veh[i].vehname;
		vehicle.vehclass = veh[i].vehclass;
		vehicle.place = veh[i].place
		vehicle.ai =	veh[i].isAI;
		drivers[veh[i].drivername] = vehicle;
	}
	return drivers;
}

function compareDriversMaps(a, b) {
	if(Object.keys(a).length != Object.keys(b).length)
		return false;
	let flag = true;
	Object.keys(a).forEach(function(name, index) {
		if(typeof b[name] !== "undefined") {
			if(a[name].name != b[name].name || a[name].vehclass != b[name].vehclass || a[name].place != b[name].place)
				flag = false;
		} else
			flag = false;
	});
	return flag;
}

function getVehPos(veh) {
	let pos = new Object();
	for(let i = 0; i < veh.length; i++) {
		let vehicle = new Object();
		vehicle.x = veh[i].posx;
		vehicle.y = veh[i].posy;
		vehicle.p = veh[i].place;
		vehicle.c = veh[i].vehclass;
		pos[veh[i].place] = vehicle;
	}
	return pos;
}

module.exports = {
	parseUDPPacket: parseUDPPacket,
	parseEventStream: parseEventStream,
	getDriversMap: getDriversMap,
	compareDriversMaps: compareDriversMaps,
	getVehPos: getVehPos
}