var arDrone		= require('ar-drone');
var websockets	= require('websockets');
var client		= arDrone.createClient();

client.takeoff();
client.calibrate();

client.on('navdata', console.log()).after(3000).land();