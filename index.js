const express = require('express')
const path = require("path");
const eta = require("eta");
const app = express()
const checkDiskSpace = require('check-disk-space').default
const logger = require('./logger')
const { realpath, readdir, readFile } = require('fs/promises')

app.engine('html', eta.renderFile)
app.set("view engine", "html")
app.set("views", "./public/views")

app.use(express.json())
app.use('/irc-logger/css', express.static(path.join(__dirname, '/public/css')))
app.use('/irc-logger/js', express.static(path.join(__dirname, '/public/js')))
app.use('/irc-logger/icons', express.static(path.join(__dirname, '/public/icons')))
app.use('/irc-logger/favicon.png', express.static(path.join(__dirname, '/public/favicon.png')))

const regex = {
    nick: new RegExp(/\<[ \+\@][^\>]+\>/),
    timestamp: new RegExp(/^[0-9]{2}:[0-9]{2}/),
    link: new RegExp(/\[(https?:\/\/\S*) (.*)\]/g),
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

    if (nick.indexOf("@") !== -1){
        img += `<img width=14px height=14px title="Global Moderator" src="irc-logger/icons/gmt.svg" class="icon"> `
        specU.color = "#db3d03"
    } else if (nick.indexOf("+") !== -1) {
        img += `<img width=14px height=14px title="Voiced Member (IRC)" src="irc-logger/icons/voice.svg" class="icon"> `
        specU.color = "#ffdf2e"
    }

    for (let u of users) {
        if (nick.indexOf(u.username) !== -1) {
            specU = u
            img += u.icons?.length > 0
                ? u.icons.map((e) => `<img width=14px height=14px title="${e.title || ""}" src="${e.src}" class="icon"> `).join("")
                : ""
            break
        }
    }

    return img+`<span class="nick" ${specU?.color ? `style="color: ${specU.color};"`: ""}>${htmlspecialchars(nick)}</span> `
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
            nick = nick ? nick[0].replace(' ', '') : null

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
                content = content.replaceAll(regex.link, `<a class="osulink" href="$1">$2</a>`)
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

