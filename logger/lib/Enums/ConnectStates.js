
const ConnectStates = {
	Disconnected: Symbol("Disconnected"),
	Connecting: Symbol("Connecting"),
	Reconnecting: Symbol("Reconnecting"),
	Connected: Symbol("Connected"),
};

module.exports = Object.freeze(ConnectStates);