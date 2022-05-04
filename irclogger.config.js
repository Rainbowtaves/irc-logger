module.exports = {
  apps: [{
    name: "irclogger",
    script: "npm start",
    restart_delay: 4000,
    autorestart: true,
    ignore_watch: ["public", "logs", ".*", "*.md", "approved.json"],
    args: [
        "--color"
    ]
  }]
}
