class Channel {
    constructor(name) {
        this.name = name
        this.joined = false
        this.callback = null
        this.members = {}
    }
}

module.exports = Channel