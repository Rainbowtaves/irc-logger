const express = require('express')
const path = require("path");
const eta = require("eta");
const app = express()
const checkDiskSpace = require('check-disk-space').default
const logger = require('./logger')
const { realpath, readdir, readFile } = require('fs/promises')
const fetch = require('node-fetch')
const XRegExp = require('xregexp');

app.engine('html', eta.renderFile)
app.set("view engine", "html")
app.set("views", "./public/views")

app.use(express.json())
app.use('/irc-logger/css', express.static(path.join(__dirname, '/public/css')))
app.use('/irc-logger/js', express.static(path.join(__dirname, '/public/js')))
app.use('/irc-logger/icons', express.static(path.join(__dirname, '/public/icons')))
app.use('/irc-logger/favicon.png', express.static(path.join(__dirname, '/public/favicon.png')))

const regex = {
    nick: new RegExp(/<([ +@])([^>]+)>/),
    timestamp: new RegExp(/^[0-9]{2}:[0-9]{2}/),
    osuLink: new RegExp(/(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:;,%_+.!~#?&\/=]*) (.*)/),
    link: new RegExp(/(?<!href=")(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:;,%_+.~#?&\/=]*)/g),
    whiteSpace: new RegExp(/(?!^_)_+(?<!_$)/g)
}

function htmlspecialchars(str) {
    if (typeof(str) == "string") {
        str = str.replace(/&/g, "&amp;"); /* must do &amp; first */
        str = str.replace(/"/g, "&quot;");
        str = str.replace(/'/g, "&#039;");
        str = str.replace(/</g, "&lt;");
        str = str.replace(/>/g, "&gt;");
    }
    return str;
}

async function parseNick(nick) {
    if (!nick) return ""
    const users = JSON.parse((await readFile('./approved.json', 'utf8')).toString())
    let img = "",
        specU = {}

    switch (nick[1]){
        case "@":
            img += `<img width=14px height=14px title="Global Moderator" src="irc-logger/icons/gmt.svg" class="icon"> `
            specU.color = "#db3d03"
            break
        case "+":
            img += `<img width=14px height=14px title="Voiced Member (IRC)" src="irc-logger/icons/voice.svg" class="icon"> `
            specU.color = "#ffdf2e"
            break
    }

    for (let u of users) {
        if (nick[2] === u.username) {
            specU = u
            img += u.icons?.length > 0
                ? u.icons.map((e) => `<img width=14px height=14px title="${e.title || ""}" src="${e.src}" class="icon"> `).join("")
                : ""
            break
        }
    }

    return img+`<a target="_blank" href="/redirect/nickname/${nick[2]}" class="nick" ${specU?.color ? `style="color: ${specU.color};"`: ""}>${htmlspecialchars("<"+nick[1].trim()+nick[2]+">")}</a> `
}

function parseLinks(content) {
    let cont = content
    for (let i of XRegExp.matchRecursive(cont, '\\[', '\\]', 'g', {unbalanced: 'skip'})) {
        const link = i.match(regex.osuLink)
        if (link) {
            cont = cont.replace("["+i+"]", `<a class="osulink" href="${link[1]}" target="_blank">${link[2]}</a>`)
        }
    }
    cont = cont.replaceAll(regex.link, `<a className="osulink" href="$1" target="_blank">$1</a>`)
    return cont
}

app.post('/check', async (req, res) => {
    if (!req.body) return res.sendStatus(404)
    const {channel, date} = req.body
    if (!channel || !date) return res.sendStatus(400)
    try {
        const logs = await realpath('logs')
        const filename = path.join(logs, channel, date+".log")
        const f = await readFile(filename, 'utf8')
        return res.status(200).send((f.toString().split('\n').length-1).toString())
    } catch (e) {
        console.error(e)
        return res.sendStatus(404)
    }
})

app.post('/getlog', async (req, res) => {
    if (!req.body) return res.sendStatus(404)
    const {channel, date, search, offset} = req.body

    if (!channel || !date) return res.sendStatus(400)
    try {
        const logs = await realpath('logs')
        const filename = path.join(logs, channel, date+".log")
        const f = await readFile(filename, 'utf8')
        const arr = f.toString().split('\n')

        let lineOffset = offset || 0
        let html = ''

        for (let i = lineOffset ; i < arr.length-1 ; i++) {
            if (search && arr[i].indexOf(search) === -1) continue
            if (arr[i].indexOf("-!- Irssi:") !== -1) continue

            let timestamp = arr[i].match(regex.timestamp),
                nick = regex.nick.exec(arr[i]),
                content = arr[i].slice(nick ? nick.index+nick[0].length : timestamp ? 8 : 0)
            html += timestamp ? `<span class="timestamp">${htmlspecialchars(timestamp)}</span> ` : ""
            html += await parseNick(nick)

            if (content.indexOf("-!-") !== -1) {
                content = `<span class="content"><i><font color=#474747>${htmlspecialchars(content)}</font></i></span> `
            } else if (content.indexOf("*") === 2) {
                content = `<span class="content"><i>${htmlspecialchars(content)}</i></span>`
            } else {
                content = `<span class="content">${htmlspecialchars(content)}</span>`
            }

            if (content.search(regex.link) !== -1) {
                content = parseLinks(content)
            }

            html += content
            html += "<br>";
        }
        return res.json(JSON.stringify({length: arr.length-1, html: html}))
    } catch (e) {
        console.error(e)
        return res.sendStatus(404)
    }
})

app.get('/redirect/nickname/:username', async (req, res) => {
    if(!req.params.username) res.status(400).send('No username specified')
    const username = req.params.username
    const data = await fetch(`https://osu.ppy.sh/u/${username}`, {method: 'HEAD'})
    if (data.status === 404 && username.search(regex.whiteSpace)) {
        return res.redirect(`https://osu.ppy.sh/u/${username.replaceAll(regex.whiteSpace, '%20')}`)
    }
    return res.redirect(data.url)
})

app.get('/', async (req,res) => {
    const logsRealPath = await realpath('logs')
    const dirs = await readdir(logsRealPath)
    const diskSpace = await checkDiskSpace('/')
    res.render('index', {
        dirs: dirs,
        diskSpace: diskSpace
    })
})

app.listen('8080', () => {
    logger.ready('Server is ready and running at port 8080')
})

