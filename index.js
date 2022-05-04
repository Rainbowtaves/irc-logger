require('dotenv').config()

const express = require('express')
const path = require("path");
const eta = require("eta");
const app = express()
const checkDiskSpace = require('check-disk-space').default
const logger = require('./logger')
const { realpath, readdir, readFile } = require('fs/promises')
const fetch = require('node-fetch')
const moment = require('moment')
const {parseLinks, parseNick, htmlspecialchars, regex} = require("./functions");


app.engine('html', eta.renderFile)
app.set("view engine", "html")
app.set("views", "./public/views")

app.use(express.json())
app.use('/css', express.static(path.join(__dirname, '/public/css')))
app.use('/js', express.static(path.join(__dirname, '/public/js')))
app.use('/icons', express.static(path.join(__dirname, '/public/icons')))
app.use('/favicon.png', express.static(path.join(__dirname, '/public/favicon.png')))

app.get('/', async (req,res) => {
    const logsRealPath = await realpath(process.env.LOGSPATH || 'logs')
    const dirs = await readdir(logsRealPath)
    const diskSpace = await checkDiskSpace('/')
    res.render('index', {
        dirs: dirs,
        diskSpace: diskSpace
    })
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
            html += '<div class="message">'
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
            html += '</div>'
        }
        return res.json(JSON.stringify({length: arr.length-1, html: html}))
    } catch (e) {
        console.error(e)
        return res.sendStatus(404)
    }
})

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

app.get('/redirect/nickname/:username', async (req, res) => {
    if(!req.params.username) res.status(400).send('No username specified')
    const username = req.params.username
    const data = await fetch(`https://osu.ppy.sh/u/${username}`, {method: 'HEAD'})
    if (data.status === 404 && username.search(regex.whiteSpace)) {
        return res.redirect(`https://osu.ppy.sh/u/${username.replaceAll(regex.whiteSpace, '%20')}`)
    }
    return res.redirect(data.url)
})

app.listen(process.env.PORT || 8080, () => {
    logger.ready('Server is ready and running at port 8080')
})

