const rfactor = require('../server/rfactor');
const MAX_PACKET_LEN = 32768;

class Scoring {
	version; // uint8
	pnum; // uint8
	sequence; // uint16
	type; // uint8

	server; // Server

	trackname; // string
	sessionid; // uint32
	sessionname; // string
	currtime; // double/float
	endtime; // double/float
	maxlaps; // uint32
	lapdist; // double/float
	numveh; // uint32
	phase; // uint8
	phasename; // string
	yellowstate; // uint8
	yellowname; // string
	sectorflag; // SectorFlags
	startlight; // uint8
	numredlights; // uint8

	veh; // Array<Veh>

	results; // string

	constructor() {
		this.server = new Server();
		this.veh = new Array();
		this.sectorflag = new SectorFlags();
	}
	
	serialize() {
		let packets = new PacketCollection(this.version);
		//packets.addInt(this.version, 1);
		//packets.addInt(this.pnum, 1);
		//packets.addInt(this.sequence, 2);
		packets.addInt(this.type, 1);
		packets.addInt(this.server.ip, 4);
		packets.addInt(this.server.port, 2);
		packets.addString(this.server.name, 32);
		packets.addInt(this.server.maxplayers, 4);
		packets.addFloat(this.server.starttime, 4);
		packets.addString(this.trackname, 64);
		packets.addInt(this.sessionid, 4);
		packets.addFloatOrDouble(this.currtime);
		packets.addFloatOrDouble(this.endtime);
		packets.addInt(this.maxlaps, 4);
		packets.addFloatOrDouble(this.lapdist);
		packets.addInt(this.numveh, 4);
		packets.addInt(this.phase, 1);
		packets.addInt(this.yellowstate, 1);
		packets.addInt(this.sectorflag.sector1, 1);
		packets.addInt(this.sectorflag.sector2, 1);
		packets.addInt(this.sectorflag.sector3, 1);
		packets.addInt(this.startlight, 1);
		packets.addInt(this.numredlights, 1);
		for(let veh of this.veh) {
			packets.addFloatOrDouble(veh.posx);
			packets.addFloatOrDouble(veh.posy);
			packets.addInt(veh.place, 1);
			packets.addFloatOrDouble(veh.lapdist);
			packets.addFloatOrDouble(veh.lateralpos);
			packets.addFloatOrDouble(veh.speed);
			packets.addString(veh.vehname, 64);
			packets.addString(veh.drivername, 32);
			packets.addString(veh.vehclass, 32);
			packets.addInt(veh.laps, 2);
			packets.addFloatOrDouble(veh.bests1);
			packets.addFloatOrDouble(veh.bests2);
			packets.addFloatOrDouble(veh.bestlap);
			packets.addFloatOrDouble(veh.lasts1);
			packets.addFloatOrDouble(veh.lasts2);
			packets.addFloatOrDouble(veh.lastlap);
			packets.addFloatOrDouble(veh.currs1);
			packets.addFloatOrDouble(veh.currs2);
			packets.addFloatOrDouble(veh.timebehindleader);
			packets.addInt(veh.lapsbehindleader, 4);
			packets.addFloatOrDouble(veh.timebehindnext);
			packets.addInt(veh.lapsbehindnext, 4);
			packets.addInt(veh.numpits, 2);
			packets.addInt(veh.numpenalties, 2);
			packets.addBool(veh.isAI);
			packets.addInt(veh.inpit, 1);
			packets.addInt(veh.sector, 1);
			packets.addInt(veh.status, 1);
		}
		packets.addString(this.results);
		return packets;
	}

	deserialize(p) {
		return rfactor.parseUDPPacket(p);
	}
}

class Server {
	ip; // uint32
	port; // uint16
	name; // string
	maxplayers; // uint32
	starttime; // float
}

class SectorFlags {
	sector1; // uint8
	sector2; // uint8
	sector3; // uint8
}

class Veh {
	posx; // double/float
	posy; // double/float
	place; // uint8
	lapdist; // double/float
	lateralpos; // double/float
	speed; // double/float
	vehname; // string
	drivername; // string
	vehclass; // string
	laps; // uint16
	bests1; // double/float
	bests2; // double/float
	bestlap; // double/float
	lasts1; // double/float
	lasts2; // double/float
	lastlap; // double/float
	currs1; // double/float
	currs2; // double/float
	timebehindleader; // double/float
	lapsbehindleader; // uint32
	timebehindnext; // double/float
	lapsbehindnext; // uint32
	numpits; // uint16
	numpenalties; // uint16
	isAI; // bool (uint8)
	inpit; // uint8
	sector; // uint8
	status; // uint8
}

class PacketCollection {
	packets;
	version;
	sequence;

	constructor(version) {
		this.packets = new Array();
		this.version = version;
		this.sequence = 0;
	}

	addInt(data, size) {
		this.add(data, size, 'int');
	}

	addString(data, size) {
		this.add(data, size ? size : 0);
	}

	addFloat(data, size) {
		this.add(data, size, 'float');
	}

	addFloatOrDouble(data) {
		this.add(data, this.version == 1 ? 8 : 4);
	}

	addBool(data) {
		this.add(data ? 1 : 0, 1, 'int');
	}

	add(data, size, type) {
		let packet;
		if(this.packets.length == 0) {
			this.sequence++;
			packet = new Packet(this.version, this.packets.length, this.sequence);
			this.packets.push(packet);
		} else if(this.packets.length+size > MAX_PACKET_LEN) {
			packet = new Packet(this.version, this.packets.length, this.sequence);
			this.packets.push(packet);
		} else
			packet = this.packets[this.packets.length-1];
		packet.append(data, size, type);
	}
}

class Packet {
	buffer;
	length;

	constructor(version, packet, sequence) {
		this.buffer = Buffer.alloc(MAX_PACKET_LEN, 0);
		this.length = 0;
		this.append(version, 1, 'int');
		this.append(packet, 1, 'int');
		this.append(sequence, 2, 'int');
	}

	append(data, size, type) {
		console.log(data, size, this.length);
		if(this.length+size > MAX_PACKET_LEN)
			throw new Error('Exceeded max packet length');
		if(typeof data === 'string') {
			let length = size ? Math.min(data.length, size) : data.length;
			console.log(data.length, length);
			this.buffer.write(data, this.length, length, 'utf-8');
			this.length += length + (data.length < size ? 1 : 0);
		} else if(typeof data === 'number') {
			if(type === 'int') {
				if(size === 8)
					this.buffer.writeBigUInt64LE(data, this.length);
				else if(size === 4)
					this.buffer.writeUInt32LE(data, this.length);
				else if(size === 2)
					this.buffer.writeUInt16LE(data, this.length);
				else if(size === 1)
					this.buffer.writeUInt8(data, this.length);
				else
					throw new Error('Invalid size');
			} else {
				if(size === 8)
					this.buffer.writeDoubleLE(data, this.length);
				else if(size === 4) {
					this.buffer.writeFloatLE(data, this.length);
					if(type !== 'float')
						this.length += 4;
				} else
					throw new Error('Invalid size');
			}
			this.length += size;
		} else if(typeof data === 'undefined' && size == 0)
			;
		else
			throw new Error('Invalid data');
	}
}

module.exports = {
	Scoring: Scoring,
	Server: Server,
	SectorFlags: SectorFlags,
	Veh: Veh,
	PacketCollection: PacketCollection,
	Packet: Packet
};
