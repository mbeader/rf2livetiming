var livetable;
var sessionbests = null;
var lapcolumn = 4;

socket.emit('join', 'live');

socket.on('vehs', function (vehs) {
	updateLiveTable(vehs);
	sortLiveTable();
	if(vehs.length > 0)
		updateRemainingLaps(Number.parseInt(livetable.firstElementChild.children[lapcolumn].textContent)+1);
	else
		updateRemainingLaps();
});

socket.on('bests', function (bests) {
	sessionbests = bests;
});

document.addEventListener('DOMContentLoaded', initLoad, false);
function initLoad(e) {
	let req = new XMLHttpRequest();
	req.addEventListener('load', function () {
		let res = JSON.parse(this.responseText);
		if(res.info.track !== '' && res.info.session !== '') {
			document.getElementById('session').textContent = res.info.session + ' @ ' + res.info.track;
			updatePhase(res.info.phase);
		} else if(res.info.track !== '') {
			document.getElementById('session').textContent = res.info.track;
			updatePhase(null);
		}
		setRemainingTime(res.info.currtime, res.info.endtime);
		if(res.info.session.startsWith('Race'))
			maxlaps = res.info.maxlaps;
		else
			maxlaps = null;
		livetable = document.getElementById('live-timing').getElementsByTagName('tbody')[0];
	});
	req.open('GET', '/init');
	req.send();
}

function compareVehs(a, b) {
	let ap = Number.parseInt(a.children[0].textContent);
	let bp = Number.parseInt(b.children[0].textContent);
	if (ap < bp)
		return -1;
	if (ap > bp)
		return 1;
	return 0;
}

function updateLiveTable(vehs) {
	let found = false;
	let oldfound = new Array(livetable.children.length).fill(false);
	for(let i = 0; i < vehs.length; i++) {
		for(let j = 0; j < livetable.children.length; j++) {
			if(livetable.children[j].children[1].textContent == vehs[i].drivername && livetable.children[j].children[3].textContent == vehs[i].vehclass && livetable.children[j].children[2].textContent == vehs[i].vehname) {
				updateLiveTableElement(livetable.children[j], vehs[i]);
				found = true;
				oldfound[j] = true;
				break;
			}
		}
		if(!found) {
			let temp = createLiveElement(vehs[i]);
			livetable.appendChild(temp);
		}
		found = false;
	}
	for(let i = oldfound.length-1; i >= 0; i--) {
		if(!oldfound[i])
			livetable.removeChild(livetable.children[i]);
	}
}

function highlightBests(el) {
	if(typeof sessionbests.pb[el.children[1].textContent] !== 'undefined') {
		if(typeof sessionbests.pb[el.children[1].textContent][el.children[3].textContent] !== 'undefined') {
			let b = sessionbests.pb[el.children[1].textContent][el.children[3].textContent][el.children[2].textContent];
			let c = sessionbests.cb[el.children[3].textContent];
			if(typeof b !== 'undefined') {
				highlightTime(el.children[7], el.children[12], secToTime(b.s1), secToTime(c.s1));
				highlightTime(el.children[8], el.children[13], secToTime(b.s2), secToTime(c.s2));
				highlightTime(el.children[9], el.children[14], secToTime(b.s3), secToTime(c.s3));
				highlightTime(el.children[10], el.children[11], secToTime(b.t), secToTime(c.t));
				if(typeof b.s1 !== 'undefined' && typeof b.s2 !== 'undefined' && typeof b.s3 !== 'undefined')
					if(b.s1 < Number.MAX_VALUE && b.s2 < Number.MAX_VALUE && b.s3 < Number.MAX_VALUE)
					el.children[15].textContent = secToTime((b.s1+b.s2+b.s3));
			}
		}
	}
}

function highlightTime(es, ebs, b, c) {
	if(es.textContent == b) {
		ebs.textContent = b;
		if(es.textContent == c) {
			es.className = 'time cbtime';
			ebs.className = 'time cbtime';
		} else {
			es.className = 'time pbtime';
			ebs.className = 'time';
		}
	} else
		es.className = 'time';
}

function updateLiveTableElement(el, veh) {
	el.children[0].textContent = veh.place;
	el.children[4].textContent = veh.laps;
	
	if(veh.timebehindleader != 0)
		el.children[5].textContent = veh.timebehindleader.toFixed(3);
	else
		el.children[5].textContent = '';
	if(veh.timebehindleader != 0)
		el.children[6].textContent = veh.timebehindnext.toFixed(3);
	else
		el.children[6].textContent = '';
	if(veh.currs1 <= 0 && veh.currs2 <= 0) {
		if(veh.lasts1 <= 0) {
			el.children[7].textContent = '';
			el.children[8].textContent = '';
			el.children[9].textContent = '';
		} else if(veh.lasts2 <= 0) {
			el.children[7].textContent = secToTime(veh.lasts1);
			el.children[8].textContent = '';
			el.children[9].textContent = '';
		} else if(veh.lastlap <= 0) {
			el.children[7].textContent = secToTime(veh.lasts1);
			el.children[8].textContent = secToTime(veh.lasts2-veh.lasts1);
			el.children[9].textContent = '';
		} else {
			el.children[7].textContent = secToTime(veh.lasts1);
			el.children[8].textContent = secToTime(veh.lasts2-veh.lasts1);
			el.children[9].textContent = secToTime(veh.lastlap-veh.lasts2);
		}
	} else {
		if(veh.currs1 > 0)
			el.children[7].textContent = secToTime(veh.currs1);
		if(veh.currs2 > 0)
			el.children[8].textContent = secToTime(veh.currs2-veh.currs1);
		else
			el.children[8].textContent = '';
		el.children[9].textContent = '';
	}
	if(veh.lastlap > 0)
		el.children[10].textContent = secToTime(veh.lastlap);
	else
		el.children[10].textContent = '';
	if(veh.bestlap > 0)
		el.children[11].textContent = secToTime(veh.bestlap);
	else
		el.children[11].textContent = '';
	
	let status = '';
	if(veh.status == 0) {
		if(veh.inpit)
			status = 'Pit';
		else if(veh.sector == 0)
			status = 'S3';
		else if(veh.sector == 1)
			status = 'S1';
		else if(veh.sector == 2)
			status = 'S2';
	} else if(veh.status == 1)
		status = 'Finish';
	else if(veh.status == 2)
		status = 'DNF';
	else if(veh.status == 3)
		status = 'DQ';
	el.children[17].textContent = status;
	if(sessionbests != null)
		highlightBests(el);
}

function createLiveElement(veh) {
	let e = document.createElement('tr');
	let t = '';
	t += '<td>' + veh.place + '</td>';
	t += '<td></td>';
	t += '<td></td>';
	t += '<td></td>';
	t += '<td>' + veh.laps + '</td>';
	t += '<td class="time"></td>';
	t += '<td class="time"></td>';
	t += '<td class="time"></td>';
	t += '<td class="time"></td>';
	t += '<td class="time"></td>';
	t += '<td class="time"></td>';
	t += '<td class="time"></td>';
	t += '<td class="time"></td>';
	t += '<td class="time"></td>';
	t += '<td class="time"></td>';
	t += '<td class="time"></td>';
	t += '<td>' + veh.numpits + '</td>';
	t += '<td></td>';
	e.innerHTML = t;
	if(veh.isAI)
		e.setAttribute('ai', 'true');
	e.children[1].textContent = veh.drivername;
	e.children[1].title = veh.drivername;
	e.children[2].textContent = veh.vehname;
	e.children[2].title = veh.vehname;
	e.children[3].textContent = veh.vehclass;
	e.children[3].title = veh.vehclass;
	return e;
}

function sortLiveTable() {
	let list = Array.from(livetable.children).sort(compareVehs);
	for(let i = 0; i < list.length; i++) {
		if(i % 2 != 0)
			list[i].classList.add('even');
		else
			list[i].classList.remove('even');
		livetable.appendChild(list[i]);
	}
}

function buildLiveTable(vehs) {
	for(let i = 0; i < vehs.length; i++) {
		livetable.appendChild(createLiveElement(vehs[i]));
	}
	sortHotlapsTable();
}
