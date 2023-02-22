var rtime;
var timelastset;
var rtimeinterval;
var maxlaps;

socket.on('session', function (state) {
	if(state.session == '') {
		document.getElementById('session').textContent = state.track;
		updatePhase(null);
	} else {
		document.getElementById('session').textContent = state.session + ' @ ' + state.track;
		updatePhase(state.phase);
	}
	setRemainingTime(state.currtime, state.endtime);
	if(state.session.startsWith('Race'))
		maxlaps = state.maxlaps;
	else
		maxlaps = null;
	updateRemainingLaps();
	getInfo();
});

socket.on('phase', function (phase) {
	updatePhase(phase);
});

function updateRemainingLaps(lap) {
	if(maxlaps !== null) {
		if(lap > maxlaps)
			lap = maxlaps;
		document.getElementById('rlaps').textContent = 'Lap ' + lap + ' of ' + maxlaps;
		document.getElementById('rtime').className = 'lapset';
	} else {
		document.getElementById('rlaps').textContent = '';
		document.getElementById('rtime').className = '';
	}
}

function setRemainingTime(currtime, endtime) {
	if(endtime !== null) {
		rtime = endtime - currtime;
		timelastset = new Date();
		clearInterval(rtimeinterval);
		rtimeinterval = setInterval(updateRemainingTime, 1000);
		updateRemainingTime();
		document.getElementById('rtime').style.display = '';
	} else {
		clearInterval(rtimeinterval);
		document.getElementById('rtime').style.display = 'none';
	}
}

function updateRemainingTime() {
	let t = rtime - Math.floor((new Date()-timelastset)/1000);
	if(t < 0) {
		t = 0;
		clearInterval(rtimeinterval);
	}
	let hours = Math.floor(t/3600);
	let minutes = Math.floor((t - hours*3600)/60);
	let seconds = Math.floor(t % 60);
	let str = '';
	if(hours != 0)
		str += hours + ':';
	if(minutes < 10)
		str += '0' + minutes + ':';
	else
		str += minutes + ':';
	if(seconds < 10)
		str += '0' + seconds;
	else
		str += seconds;
	document.getElementById('rtime').textContent = str;
}

function updatePhase(phase) {
	if(phase === null) {
		document.getElementById('phase').textContent = 'Server Offline';
		document.getElementById('sectors').style.display = 'none';
	} else {
		document.getElementById('sectors').style.display = '';
		if(phase.name == 'FCY')
			document.getElementById('phase').textContent = phase.name + ' (' +	phase.yellow + ')';
		else
			document.getElementById('phase').textContent = phase.name;
		for(let i = 0; i < 3; i++) {
			if(phase.sectors[i] !== 11)
				document.getElementById('sectors').children[i].className = 'yellow';
			else
				document.getElementById('sectors').children[i].className = '';
		}
	}
}