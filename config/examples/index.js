module.exports = {
	HTTP_LISTEN_PORT: 8080, // port to listen for HTTP clients
	RF2_LISTEN_PORT: 6789, // port to which the rF2 plugin sends data
	RF2_SRC_ADDR: '127.0.0.1', // IP address of rF2 server
	IPV4_LOOPBACK: '127.0.0.1', // if loopback IP for some reason is different, change this
	RF2_PUBLIC_ADDR: '10.0.0.10', // public IP of rF2 server for join link
	IGNORE_AI_HOTLAPS: false // whether best laps from AI drivers should not be tracked
};
