// for WebSocket
const { argv } = require("process");
let server = require("ws").Server;
let wss = new server({
	port: 8000,
});
let fs = require("fs");

// for ZeroMQ
const zmq = require("zeromq");
const responder = zmq.socket("sub");
responder.subscribe("");

//  connect to PyZeroMQ
console.log("tcp://" + argv[2] + ":" + argv[3]);
responder.connect("tcp://" + argv[2] + ":" + argv[3]);
responder.on("message", function (msg) {
	wss.clients.forEach((client) => {
		client.send(msg.toString());
	});
});
