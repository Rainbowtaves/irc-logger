const { readFile } = require('fs/promises')
const XRegExp = require('xregexp')

const regex = {
    nick: new RegExp(/<([ +@])([^>]+)>/),
    timestamp: new RegExp(/^[0-9]{2}:[0-9]{2}/),
    osuLink: new RegExp(/(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:;,%_+.!~#?&\/=]*) (.*)/),
    link: new RegExp(/(?<!href=")(https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:;,%_+.~#?&\/=]*)/g),
    whiteSpace: new RegExp(/(?!^_)_+(?<!_$)/g)
}


function htmlspecialchars (str) {
    if (typeof(str) == "string") {
        str = str.replace(/&/g, "&amp;"); /* must do &amp; first */
        str = str.replace(/"/g, "&quot;");
        str = str.replace(/'/g, "&#039;");
        str = str.replace(/</g, "&lt;");
        str = str.replace(/>/g, "&gt;");
    }
    return str;
}

async function parseNick (nick) {
    if (!nick) return ""
    const users = JSON.parse((await readFile('./approved.json', 'utf8')).toString())
    let img = "",
        specU = {}

    switch (nick[1]){
        case "@":
            img += `<img width=14px height=14px title="Global Moderator" src="icons/gmt.svg" class="icon"> `
            specU.color = "#db3d03"
            break
        case "+":
            img += `<img width=14px height=14px title="Voiced Member (IRC)" src="icons/voice.svg" class="icon"> `
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

    return img+`<a target="_blank" href="/irc-logger/redirect/nickname/${nick[2]}" class="username" ${specU?.color ? `style="color: ${specU.color};"`: ""}>${htmlspecialchars("<"+nick[1].trim()+nick[2]+">")}</a> `
}

function parseLinks (content) {
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

module.exports = {
    parseLinks,
    parseNick,
    htmlspecialchars,
    regex
}