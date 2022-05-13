const config = require("./config.json")
const IrcClient = require('./lib/Client')
const {PrismaClient, MessageType} = require('@prisma/client')
const prisma = new PrismaClient()

const client = new IrcClient({
    host: config.irc_server, port: config.irc_port, username: config.irc_username, realname: config.irc_username, password: config.irc_password
})

client.on("CM", (channel, user, message) => {
    let action = message.indexOf("ACTION ") === 1
    let usermode = channel.members[user]
    if (action) {
        message = message.substring(8)
    }
    prisma.message.create({
        data: {
            content: message,
            type: action ? MessageType.ACTION : MessageType.MESSAGE,
            usermode: usermode?.mode,
            created_at: new Date(),
            user: {
                connectOrCreate: {
                    create: {
                        username: user
                    },
                    where: {
                        username: user
                    }
                }
            },
            channel: {
                connectOrCreate: {
                    create: {
                        name: channel.name
                    },
                    where: {
                        name: channel.name
                    }
                }
            }
        }
    }).catch(err => {
        console.error(err)
    })
    // console.log(new Date(), channel.name, (usermode ? usermode.mode : "")+user, message)
})


client.on("MODE", (channel, byUser, toUser, mode) => {
    prisma.message.create({
        data: {
            content: `-!- mode/${channel.name} [${mode} ${toUser}] by ${byUser}`,
            type: MessageType.MODE,
            created_at: new Date(),
            user: {
                connectOrCreate: {
                    create: {
                        username: byUser
                    },
                    where: {
                        username: byUser
                    }
                }
            },
            channel: {
                connectOrCreate: {
                    create: {
                        name: channel.name
                    },
                    where: {
                        name: channel.name
                    }
                }
            }
        }
    }).catch(err => {
        console.error(err)
    })
    // console.log(new Date(), `-!- mode/${channel.name} [${mode} ${toUser}] by ${byUser}`)
})

client.connect().then(() => {
    for (let ircChannel of config.irc_channels) {
        client.join(ircChannel).then(() => {
            console.log('Joined '+ircChannel)
        }).catch((err) => {
            console.error(ircChannel)
            console.error(err)
        })
    }
})

