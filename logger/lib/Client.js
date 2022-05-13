const net = require("net");
const EventEmitter = require("events").EventEmitter;
const ConnectStates = require('./Enums/ConnectStates')
const ChannelMemberModes = require('./Enums/ChannelMemberModes')
const Channel = require('./Channel')

// class IrcClient extends EventEmitter {
//     constructor({host, port, nickname, realname, password, logging, ignoredCodes}) {
//         super();
//         this.ignoredCodes = ignoredCodes || [
//             "333",  // Time when topic was set
//             "366",  // End of NAMES reply
//             "372",  // MOTD
//             "375",  // MOTD Begin
//             "376",  // MOTD End
//             "QUIT" // User disconnects
//         ]
//         this.host = host;
//         this.port = port;
//         this.username = nickname;
//         this.realname = realname;
//         this.password = password;
//         this.logging = 1; // TODO: 0 => No Logging, 1 => Logs...
//         this.client = null;
//         this.ignoreClose = false;
//         this.users = new Map()
//         this.channels = new Map()
//         this.on("error", () => { });
//     }
//
//     send(data, throwIfDisconnected = true) {
//         this.client.write(data + "\r\n");
//         // if(throwIfDisconnected)
//         //     throw new Error("Currently disconnected!");
//     }
//
//     connect() {
//         return new Promise((resolve) => {
//             this.client = (new net.Socket()).setTimeout(60000)
//             this.client.on("error", (err) => {
//                 this.emit("error", err)
//             })
//             this.client.on("close", () => {
//                 throw new Error("Connection closed")
//             })
//             this.client.on("timeout", () => {
//                 this.client.destroy()
//                 this.emit("error", new Error("Timeout reached"))
//             })
//             let unparsedData
//             this.client.on("data", (data) => {
//                 data = data.toString().replace(/\r/g, ""); // Sometimes, Bancho sends \r, and sometimes it doesn't.
//                 unparsedData += data;
//                 let index;
//                 while ((index = unparsedData.indexOf("\n")) !== -1) {
//                     let message = unparsedData.substring(0, index);
//                     unparsedData = unparsedData.substring(index + 1);
//                     this.handleIrcMessage(message)
//
//                 }
//             })
//             this.client.connect(this.port, this.host, () => {
//                 this.send("PASS "+this.password)
//                 this.send("USER "+this.realname+" 0 * :"+this.realname)
//                 this.send("NICK "+this.username)
//                 resolve()
//             })
//         })
//     }
//
//     handleIrcMessage(message) {
//         const splits = message.split(" ");
//         if(this.ignoredCodes.includes(splits[1])) {
//             return;
//         }
//         if (splits[0] === "PING") {
//             splits.shift();
//             this.send("PONG "+splits.join(" "))
//         }
//         else {
//             if (ircCommands[splits[1]]) {
//                 (ircCommands[splits[1]]).handle(this, splits)
//             }
//             console.log(splits.join(" "))
//         }
//     }
//
//     join(channel) {
//         this.send("JOIN "+channel)
//     }
//     part(channel) {
//         this.send("PART"+channel)
//     }
// }
//


class IrcClient extends EventEmitter {
    constructor({host, port, username, realname, password, logging, ignoredCodes}) {
        super();
        this.ignoredCodes = ignoredCodes || [
            "333",  // Time when topic was set
            "366",  // End of NAMES reply
            "372",  // MOTD
            "375",  // MOTD Begin
            "376",  // MOTD End
        ]
        this.client = null;
        this.connectState = ConnectStates.Disconnected;
        this.reconnect = true;
        this.reconnectTimeout = null;
        this.connectCallback = null;
        this.channels = new Map();
        this.host = host;
        this.port = port;
        this.username = username;
        this.realname = realname;
        this.password = password;
        this.on("error", function() { });

        this.ignoreClose = false;
    }
    
    initSocket() {
        this.client = (new net.Socket()).setTimeout(60000);

        this.client.on("error", (err) => {
            /**
             * An error has occured on the socket.
             * @event BanchoClient#error
             * @type {Error}
             */
            this.emit("error", err);
            this.onClose(err);
        });

        this.client.on("close", () => {
            if(!this.ignoreClose)
                this.onClose(new Error("Connection closed"));
        });
        this.client.on("timeout", () => {
            const err = new Error("Timeout reached");
            this.ignoreClose = true;
            this.client.destroy();
            this.emit("error", err);
            this.onClose(err);
            setTimeout(() => this.ignoreClose = false, 1); // close event is apparently not fired immediately after calling destroy...
        });

        let unparsedData = "";
        this.client.on("data", (data) => {
            data = data.toString().replace(/\r/g, ""); // Sometimes, Bancho sends \r, and sometimes it doesn't.
            unparsedData += data;
            let index;
            while((index = unparsedData.indexOf("\n")) !== -1) {
                let command = unparsedData.substring(0, index);
                unparsedData = unparsedData.substring(index + 1); // 1 is the length of \n, it being 1 special character and not 2.
                this.handleIrcCommand(command);
            }
        });
    }

    send(data, throwIfDisconnected = true) {
        if(this.connectState === ConnectStates.Connected || this.connectState === ConnectStates.Connecting)
            this.client.write(data + "\r\n");
        else if(throwIfDisconnected)
            throw new Error("Currently disconnected!");
    }

    updateState(newConnectState, err) {
        if(newConnectState === this.connectState) return;
        if(newConnectState !== ConnectStates.Disconnected &&
            newConnectState !== ConnectStates.Reconnecting &&
            newConnectState !== ConnectStates.Connecting &&
            newConnectState !== ConnectStates.Connected)
            throw new Error("Invalid connect state!");
        this.connectState = newConnectState;
        if(this.isConnected())
            this.emit("connected");
        if(this.isDisconnected())
            this.emit("disconnected", err);
        this.emit("state", this.connectState, err);
    }
    
    onClose(err) {
        // Every currently joined channel should be considered left.

        if(this.connectState === ConnectStates.Disconnected)
            return;

        if(!this.reconnect) return this.updateState(ConnectStates.Disconnected, err);

        this.updateState(ConnectStates.Reconnecting, err);
        if(this.reconnectTimeout)
            clearTimeout(this.reconnectTimeout);

        this.reconnectTimeout = setTimeout(() => {
            if(this.reconnect) {
                const oldCallback = this.connectCallback;
                this.connect();
                this.connectCallback = oldCallback;
            }
            this.reconnectTimeout = null;
        }, 5000);
    }
    
    handleIrcCommand(command) {
        const splits = command.split(" ");

        if(this.ignoredCodes.indexOf(splits[1]) !== -1)
            return;
        if(splits[0] === "PING") {
            splits.shift();
            this.send("PONG "+splits.join(" "));
        }
        else {
            switch(splits[1]) {
                case "001": {
                    this.updateState(ConnectStates.Connected);
                    this.callConnectCallback();
                    break
                }
                case "403": {
                    const channel = this.getChannel(splits[3])
                    if (channel.callback) {
                        channel.callback(new Error("No such channel "+channel.name))
                        this.channels.delete(channel.name)
                    }
                    break
                }
                case "JOIN": {
                    const user = splits[0].substring(1, splits[0].indexOf('!'))
                    const channel = this.getChannel(splits[2].substring(1))
                    if (user === this.username) {
                        channel.joined = true
                        channel.callback()
                    } else {
                        this.emit("JOIN", channel, user)
                    }
                    break
                }
                case "PART": {
                    const user = splits[0].substring(1, splits[0].indexOf('!'))
                    const channel = this.getChannel(splits[2].substring(1))
                    if (user === this.username) {
                        channel.callback()
                        this.channels.delete(channel.name)
                    } else {
                        delete channel.members[user]
                        this.emit("PART", channel, user)
                    }
                    break
                }
                case "MODE": {
                    const byUser = splits[0].substring(1, splits[0].indexOf('!'))
                    const channel = this.getChannel(splits[2])
                    channel.members[splits[4]] = {}
                    channel.members[splits[4]].mode = ChannelMemberModes[splits[3].substring(1)]
                    if (splits[4] !== this.username) {
                        this.emit('MODE', channel, byUser, splits[4], splits[3])
                    }
                    break
                }
                case "353": {
                    const channel = this.getChannel(splits[4])
                    const members = splits.splice(4)
                    members[0] = members[0].substring(1)
                    for (let member of members) {
                        if (member[0] === "@" || member[0] === "+") {
                            channel.members[member.substring(1)] = {mode: member[0]}
                        }
                    }
                    break
                }
                case "PRIVMSG": {
                    const user = splits[0].substring(1, splits[0].indexOf('!'))
                    const channel = splits[2]
                    const message = splits.slice(3).join(" ").substring(1)
                    if (channel.indexOf('#') === 0) {
                        this.emit("CM", this.getChannel(channel), user, message)
                    } else {
                        this.emit("PM", channel, message)
                    }
                    break
                }
                case "QUIT": {
                    const user = splits[0].substring(1, splits[0].indexOf('!'))
                    for (let [channelName, channel] of this.channels) {
                        if (channel.members[user]) delete channel.members.user
                    }
                }
            }
        }
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            if(this.connectState === ConnectStates.Connected ||
                this.connectState === ConnectStates.Connecting)
                return reject(new Error("Already connected/connecting"));

            this.connectCallback = (err) => {
                if(err)
                    return reject(err);
                resolve();
            };

            this.updateState(ConnectStates.Connecting);
            this.reconnect = true;
            this.initSocket();
            this.client.connect(this.port, this.host, () => {
                this.send("PASS "+this.password)
                this.send("USER "+this.realname+" 0 * :"+this.realname)
                this.send("NICK "+this.username)
            });
        });
    }
    
    disconnect() {
        if(this.connectState === ConnectStates.Disconnected)
            return;

        if(this.isConnected())
            this.send("QUIT");
        else if(this.connectState === ConnectStates.Connecting)
            this.client.destroy();

        if(this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.updateState(ConnectStates.Disconnected);
        setTimeout(() => this.ignoreClose = false, 1);  // close event is apparently not fired immediately after calling destroy...	}
    }
    
    callConnectCallback(arg, erase = true, throwIfNonexistant = false) {
        if(this.connectCallback != null) {
            this.connectCallback(arg);
            if(erase)
                this.connectCallback = null;
        }
        else if(throwIfNonexistant)
            throw new Error("Inexistant connect callback!");
    }

    getChannel(channelName) {
        if (this.channels.has(channelName))
            return this.channels.get(channelName);
        else {
            const channel = new Channel(channelName)
            this.channels.set(channelName, channel)
            return channel
        }
    }

    getConnectState() {
        return this.connectState;
    }
    
    isConnected() {
        return (this.connectState === ConnectStates.Connected);
    }
    
    isDisconnected() {
        return (this.connectState === ConnectStates.Disconnected);
    }

    join(channelName) {
        return this._joinOrPart("JOIN", channelName)
    }
    part(channelName) {
        return this._joinOrPart("PART", channelName)
    }
    _joinOrPart(method, channelName) {
        return new Promise((resolve, reject) => {
            const channel = this.getChannel(channelName)
            this.send(method+" "+channelName)
            channel.callback = (err) => {
                if (err) reject(err)
                else {
                    resolve(channel)
                }
            }
        })
    }
}

module.exports = IrcClient