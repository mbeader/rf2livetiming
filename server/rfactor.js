const config = require('../config');
const xmlescapes = ['&amp;', '&lt;', '&gt;', '&quot;', '&apos;']
const xmlchars = ['&', '<', '>', '"', '\''];
const games = { 1: 365960, 2: 339790, 3: 431600 };

class PacketState {
	current;
	version;
	pnum;
	sequence;
	type;

	constructor() {

	}

	enqueue(msg) {
		let p = this.readMeta(msg);
		if(this.current) {
			if(this.version != p.version || this.type != p.type) {
				if(p.pnum != 0) {
					console.log('got non-leading of different packet');
					this.current = null;
				} else {
					console.log('got leading of different packet');
					this.reset(p, msg);
				}
			} else if(this.sequence != p.sequence) {
				if(p.pnum != 0) {
					console.log('got non-leading of different sequence');
					this.current = null;
				} else {
					console.log('got leading of different sequence');
					this.reset(p, msg);
				}
			} else if(this.pnum+1 != p.pnum && p.pnum != 0) {
				console.log('got out of order');
				this.current = null;
			} else if(this.pnum+1 != p.pnum && p.pnum == 0) {
				console.log('got different sequence');
				this.reset(p, msg);
			} else {
				this.pnum = p.pnum;
				this.current[this.pnum] = msg;
			}
		} else {
			this.reset(p, msg);
		}
		if(this.current && p.continue === 1)
			return true
		return false;
	}

	reset(p, msg) {
		this.current = new Object();
		this.version = p.version;
		this.pnum = p.pnum;
		this.sequence = p.sequence;
		this.type = p.type;
		this.current[this.pnum] = msg;
	}

	clear() {
		this.current = null;
		this.version = null;
		this.pnum = null;
		this.sequence = null;
		this.type = null;
	}

	readMeta(msg) {
		let p = new Object();
		//console.log(msg.toString('hex'));
		// 1-rf2 2-rf1 3-ams
		p.version = msg.readUInt8(0);
		p.pnum = msg.readUInt8(1);
		p.sequence = msg.readUInt16LE(2);
		p.type = msg.readUInt8(4);
		p.continue = msg.readUInt8(msg.length-1);
		//console.log(msg.length, p.version, p.pnum, p.sequence, p.type, p.continue, '-', this.pnum);
		return p;
	}

	dequeue() {
		if(!this.current || this.current.length === 0)
			return null;
		if(this.pnum === 0) {
			let buffer = this.current[this.pnum];
			this.clear();
			return buffer;
		}
		let buffers = new Array();
		buffers[0] = this.current[0].subarray(0, this.current[0].length-1);
		//console.log('buf', this.pnum, this.current[0].length, this.current[1].length, this.current[2].length, this.current[3].length);
		for(let i = 1; i <= this.pnum; i++)
			buffers[i] = this.current[i].subarray(5, this.current[i].length-(i == this.pnum ? 0 : 1));
		this.clear();
		return Buffer.concat(buffers);
	}
}

function parseUDPPacket(msg) {
	if(state.enqueue(msg)) {
		let p = state.dequeue();
		if(p)
			return parsePacket(p);
	}
}

function parsePacket(msg) {
	let p = state.readMeta(msg);
	if(p.type == 2)
		return parseScoringPacket(msg, p);
	else 
		return;
}

function parseScoringPacket(msg, p)	{
	let k;
	let pointer = 5;
	let readDoubleOrFloatLE;
	switch(p.version) {
		case 2:
		case 3:
			readDoubleOrFloatLE = function(msg, pointer) { return msg.readFloatLE(pointer); };
			break;
		case 1:
		default:
			readDoubleOrFloatLE = function(msg, pointer) { return msg.readDoubleLE(pointer); };
			break;
	}
	
	p.server = new Object();
	p.server.game = games[p.version];
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
	if(p.version == 2)
		switch(p.sessionid) {
			case 0: p.sessionname = "Test Day";
			break;
			case 1: case 2: case 3: case 4: p.sessionname = "Practice " + p.sessionid;
			break;
			case 5: p.sessionname = "Qualifying";
			break;
			case 6: p.sessionname = "Warmup";
			break;
			case 7: p.sessionname = "Race";
			break;
			default: p.sessionname = "Unknown";
		}
	else
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
	p.currtime = readDoubleOrFloatLE(msg, pointer);
	pointer += 8;
	p.endtime = readDoubleOrFloatLE(msg, pointer);
	if(p.endtime == -2147483648)
		p.endtime = null;
	pointer += 8;
	p.maxlaps = msg.readUInt32LE(pointer);
	if(p.maxlaps == 2147483647)
		p.maxlaps = null;
	pointer += 4;
	p.lapdist = readDoubleOrFloatLE(msg, pointer);
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
	// sector flags
	// rf2: [s1,s2,s3] 1-yellow 2-? 3-? 11-green
	// rf1/ams: [s3,s1,s2] 0-green 2-yellow
	p.sectorflag = [msg.readUInt8(++pointer), msg.readUInt8(++pointer), msg.readUInt8(++pointer)];
	if(p.version == 2 || p.version == 3) {
		p.sectorflag = [p.sectorflag[1], p.sectorflag[2], p.sectorflag[0]];
		for(let i = 0; i < p.sectorflag.length; i++)
			switch(p.sectorflag[i]) {
				case 0: p.sectorflag[i] = 11; break;
				case 2: p.sectorflag[i] = 1; break;
			}
	}
	p.startlight = msg.readUInt8(++pointer);
	p.numredlights = msg.readUInt8(++pointer);
	pointer++;
	//if((p.version != 1 && p.sectorflag[0] + p.sectorflag[1] + p.sectorflag[2] > 0) || (p.version == 1 && (p.sectorflag[0] != 11 || p.sectorflag[1] != 11 || p.sectorflag[2] != 11)))
	//	console.log(p.sessionname, p.sectorflag[0], p.sectorflag[1], p.sectorflag[2]);
	p.veh = [];
	for(let i = 0; i < p.numveh; i++) {
		let veh = new Object();
		veh.posx = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.posy = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.place = msg.readUInt8(pointer++);
		veh.lapdist = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.lateralpos = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.speed = readDoubleOrFloatLE(msg, pointer);
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
		veh.bests1 = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.bests2 = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.bestlap = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.lasts1 = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.lasts2 = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.lastlap = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.currs1 = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.currs2 = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.timebehindleader = readDoubleOrFloatLE(msg, pointer);
		pointer += 8;
		veh.lapsbehindleader = msg.readUInt32LE(pointer);
		pointer += 4;
		veh.timebehindnext = readDoubleOrFloatLE(msg, pointer);
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
	p.results = msg.toString('ascii', pointer, msg.length-1);
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
	xml = xml.replace('\x7F', '☺'); // rf1 ctrl-backspace smiley (DEL char)
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

function randomGrid(drivers) {
	let remaining = new Array();
	for(let driver in drivers)
		remaining.push(driver);
	let count = remaining.length;
	let res = '';
	for(let i = 1; i <= count; i++)
		res += '/editgrid ' + i + ' ' + remaining.splice(Math.floor(Math.random()*remaining.length), 1)[0] + '\r\n';
	return res;
}

const state = new PacketState();
module.exports = {
	parseUDPPacket: parseUDPPacket,
	parseEventStream: parseEventStream,
	getDriversMap: getDriversMap,
	compareDriversMaps: compareDriversMaps,
	getVehPos: getVehPos,
	randomGrid: randomGrid
}
