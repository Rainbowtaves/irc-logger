module.exports = {
  apps: [{
    name: "irc-loggers",
    script: "index.js",
    watch: true,
    ignore_watch: ["node_modules", "public", "logs", ".*", "*.md", "*.json"],
    args: [
        "--color"
    ]
  }]
}
