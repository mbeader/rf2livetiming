const { Scoring, Server, SectorFlags, Veh } = require('./packet');

let p = new Scoring();
p.version = 1;
p.pnum = 0;
p.sequence = 1;
p.type = 2;
p.server = new Server();
p.server.ip = 4278190081;//'127.0.0.1';
p.server.port = 42069;
p.server.name = 'Test server';
p.server.maxplayers = 69;
p.server.starttime = 10.0;
p.trackname = 'Lime Rock';
p.sessionid = 1;
p.sessionname = 'Practice 1';
p.currtime = 2.0;
p.endtime = 3.0;
p.maxlaps = 10;
p.lapdist = 4.0;
p.numveh = 1;
p.phase = 5;
p.phasename = 'Green';
p.yellowstate = 0;
p.yellowname = 'None';
p.sectorflag = new SectorFlags();
p.sectorflag.sector1 = 0;
p.sectorflag.sector2 = 0;
p.sectorflag.sector3 = 0;
p.startlight = 0;
p.numredlights = 0;
p.veh = [new Veh()];
p.veh[0].posx = 10.0;
p.veh[0].posy = 20.0;
p.veh[0].place = 1;
p.veh[0].lapdist = 30.0;
p.veh[0].lateralpos = 40.0;
p.veh[0].speed = 50.0;
p.veh[0].vehname = 'Car';
p.veh[0].drivername = 'Driver';
p.veh[0].vehclass = 'Class';
p.veh[0].laps = 22;
p.veh[0].bests1 = 60.0;
p.veh[0].bests2 = 70.0;
p.veh[0].bestlap = 80.0;
p.veh[0].lasts1 = 90.0;
p.veh[0].lasts2 = 100.0;
p.veh[0].lastlap = 110.0;
p.veh[0].currs1 = 120.0;
p.veh[0].currs2 = 130.0;
p.veh[0].timebehindleader = 140.0;
p.veh[0].lapsbehindleader = 16;
p.veh[0].timebehindnext = 150.0;
p.veh[0].lapsbehindnext = 15;
p.veh[0].numpits = 44;
p.veh[0].numpenalties = 7;
p.veh[0].isAI = false;
p.veh[0].inpit = 0;
p.veh[0].sector = 1;
p.veh[0].status = 0;
p.results = '<t></t>';

console.log('serialize');
let serialized = p.serialize();

console.log('deserialize', serialized.packets.length);
let deserialized;
for(let packet of serialized.packets)
	deserialized = p.deserialize(packet.buffer.subarray(0, packet.length));

function compare(ex, ac) {
	for(let prop in ex) {
		if(ex[prop] instanceof Server) {
			compare(ex[prop], ac[prop]);
		} else if(ex[prop] instanceof SectorFlags) {
			compare([ex[prop].sector1,ex[prop].sector2,ex[prop].sector3], ac[prop]);
		} else if(ex[prop] instanceof Veh) {
			compare(ex[prop], ac[prop]);
		} else if(ex[prop] instanceof Array) {
			if(!(ac[prop] instanceof Array)) {
				console.log('Actual is not an array: ' + prop + '.', typeof ac[prop]);
				continue;
			} else if(ex[prop].length != ac[prop].length) {
				console.log('Different length: ' + prop + '.', 'Expected:', ex[prop], 'Actual:', ac[prop]);
				continue;
			}
			for(let i = 0; i < ex[prop].length; i++)
				compare(ex[prop][i], ac[prop][i]);
		} else if(typeof ex[prop] === typeof ac[prop]) {
			if(typeof ex[prop] === 'object')
				compare(ex[prop], ac[prop]);
			else if(ex[prop] !== ac[prop])
				console.log('Not equal: ' + prop + '.', 'Expected:', JSON.stringify(ex[prop]), 'Actual:', JSON.stringify(ac[prop]));
		} else
			console.log('Mismatched type: ' + prop + '.', 'Expected:', ex[prop], 'Actual:', ac[prop]);
	}
}

compare(p, deserialized);
