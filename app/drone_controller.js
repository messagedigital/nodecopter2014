var net = require('net');
var arDrone		= require('ar-drone');
var client		= arDrone.createClient();
var leapClient	= net.connect(1337, '192.168.1.4', function() {});
var riftClient	= net.connect(1337, '192.168.1.2', function() {});

var inair	= false;
var landing	= false;
var calibrated = false;

leapClient.on('data', function(data) {
	var input = parseInt(data.toString());
	var duration	= 500;
	console.log('data: ' + data);
	console.log('input: ' + input);
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
				duration	= -(input) * 100;
				console.log('up');
				client.down(0.1);
			}
			else if (input > 0){
				duration	= input * 100;
				console.log('down');
				client.up(0.1);
			}
			else {
				console.log('re-calibrating');
				client.calibrate();
				setTimeout(function() {calibrated = true; console.log('re-calibrated');}, 1000);
			}

			if (duration > 3000) {
				duration = 3000;
			}
			console.log('duration: ' + duration);
			setTimeout(function() {
				console.log('stopping');
				client.stop();
			}, 200);
		}
	}

//	setTimeout(function() { console.log('waiting'); }, 200);
});

riftClient.on('data', function(data) {

});