# irc-logger

irc-logger is a web app that displays saved daily logs from irssi.

This is a Node JS rewrite of IRC-Logger since PHP isn't really optimized for reading big files

## Setup

1. Create symlink for logs folder and name it `logs` or set the path in `.env` file
2. To run the web-server simply go to project folder and run `npm start`



## PM2 process manager
   This project has [PM2 Ecosystem Config](https://pm2.keymetrics.io/docs/usage/application-declaration/) for handling crashes or restart on changes (if `--watch` option is specified)

### Commands
```bash
# Start app from PM2 ecosystem config
pm2 start irclogger.config.js  # add --watch if you want to restart the app on changes
# Stop app
pm2 stop irclogger.config.js
# Restart app 
pm2 restart irclogger.config.js
# Reload config file (required if irclogger.config.js was changed)
pm2 reload irclogger.config.js
```
All CLI flags can be found [here](https://pm2.io/docs/runtime/reference/pm2-cli/)

You can run `pm2 save` and `pm2 startup`(requires sudo) to make pm2 start the app if server reboots


## IRSSI Configuration
1. Configure irssi's logs settings:
   * `/SET autolog_level ALL -CRAP -CLIENTCRAP -CTCPS -JOINS -PARTS -QUITS -DCC -MSGS`
   * `/SET term_charset utf-8`
   * `/SET log_create_mode 755`
   * `/SET autolog_path ~/irclogs/$tag/$0/%Y-%m-%d.log`
   * `/SET autolog ON`
   * `/save`

   Note: `autolog_path` contains following variables:

   `$tag` is server name
   `$0` is channel name
   `%Y-%m-%d.log` is output file name (logs will be rolled everyday) (f.e. `2015-10-17.log`)

2. After all these steps make sure you have following entries in ~/.irssi/conf file:

   ```
   settings = {
     core = {
       log_create_mode = "755";
     };
     "fe-common/core" = {
       autolog_path = "~/irclogs/$tag/$0/%Y-%m-%d.log";
       AUTOLOG = "yes";
       autolog_level = "ALL -CRAP -CLIENTCRAP -CTCPS -JOINS -PARTS -QUITS -DCC -MSGS";
       term_charset = "utf-8";
   };
   ```

   More on irssi's logging in [irssi documentation](http://www.irssi.org/documentation).

3. Now create symbolic link in your website directory: `ln -s ~/irclogs/<servername> logs` and you are good to run these php scripts :)

## About handling private channels
If you don't want to log some channels just `/part` them so irssi won't collect logs.

