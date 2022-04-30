/*
Logger class for easy and aesthetically pleasing console logging 
*/
const moment = require("moment");
const {blue, red, green, yellowBright, magenta, yellow, redBright} = require('chalk');

function parseType(type = "log") {
    type = type.toUpperCase()
    switch (type) {
        case 'WARN':
            return yellow(type)
        case 'ERROR':
            return red(type)
        case 'DEBUG':
            return magenta(type)
        case 'READY':
            return green(type)
        case 'SETUP':
            return yellowBright(type)
        default:
            return blue(type)
    }
}
let timeMeasure = Date.now()

exports.log = (content, type = "log") => {
    const timestamp = moment().format('DD-MM-YYYY HH:mm:ss')
    console.log(`[${timestamp}][${parseType(type)}] ${content} ${(redBright.italic((Date.now() - timeMeasure)+"ms"))}`)
    if (content instanceof Error) console.error(content)
    timeMeasure = Date.now()
}

exports.warn = (...args) => this.log(...args, "warn")

exports.error = (...args) => this.log(...args, 'error');

exports.ready = (...args) => this.log(...args, 'ready');

exports.debug = (...args) => this.log(...args, 'debug')
