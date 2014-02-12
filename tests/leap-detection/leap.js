var net = require('net');
var arDrone		= require('ar-drone');
var client		= arDrone.createClient();
var leapClient	= net.connect(1337, '192.168.1.2', function() {
});

var inair	= false;
var landing	= false;
var calibrated = false;

leapClient.on('data', function(data) {
	var input = parseInt(data.toString());
	var duration	= 500;

	if (input !== null) {
		if (!inair) {
			console.log('inair', inair);
			client.takeoff();
			setTimeout(function() {client.calibrate(); setTimeout(function() {calibrated = true;}, 1000); console.log('calibrated'); }, 5000);
			console.log('calibrated', calibrated);
			inair	= true;
		}
		else if (calibrated) {
			if (input < 0) {
				duration	= -(input) * 500;
				console.log('up');
				client.down(0.1);
			}
			else if (input > 0){
				duration	= input * 500;
				console.log('down');
				client.up(0.1);
			}
			else {
				console.log('re-calibrating');
				client.calibrate();
				console.log('re-calibrated');
			}

			if (duration > 3000) {
				duration = 3000;
			}
			console.log(duration);
			setTimeout(function() {
				console.log('stopping');
				client.stop();
			}, 150);
		}
	}

//	setTimeout(function() { console.log('waiting'); }, 200);
});