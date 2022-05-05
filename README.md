# irc-logger

irc-logger is a web app that displays saved daily logs from irssi.

This is a Node JS rewrite of IRC-Logger since PHP isn't really optimized for reading big files

## Setup

1. Create symlink for logs folder and name it `logs` or set the path in `.env` file
2. To run the app simply go to project folder and run `npm start`



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

You can use any IRC client you want but it's recommended to use [IRSSI](https://irssi.org/). IRC client must have the same file (and filename) format and log directory structure as IRSSI.
Here's an example of logfile structure:
```text
--- Log opened Thu May 05 00:00:20 2022
00:00:24 -!- mode/#announce [+o Osu_Tatakae_Ouendan] by BanchoBot
00:13:51 -!- mode/#announce [+v GrilledCheeese] by BanchoBot
00:14:25 < BanchoBot> [http://osu.ppy.sh/s/1155707 Yuki - Rightfully (TV Chamber Freakout Version)] has been revived from eternal slumber by [http://osu.ppy.sh/u/4913259 _Nikson_].
00:18:23 < BanchoBot> [http://osu.ppy.sh/u/1688846 Emperorpenguin83] achieved rank #1 on [http://osu.ppy.sh/b/357544?m=0 nao - scarlet leap [Gu's Hard]] (osu!)
00:20:44 < BanchoBot> [http://osu.ppy.sh/s/1538237 Ardolf - Chromatic] has been revived from eternal slumber by [http://osu.ppy.sh/u/2164993 Fynbi].
00:26:17 -!- mode/#announce [+o Shurelia] by BanchoBot
00:26:22 < BanchoBot> [http://osu.ppy.sh/u/5155973 Rizer] achieved rank #1 on [http://osu.ppy.sh/b/3376932?m=0 SAMString - Shifting Clouds [Expert]] (osu!)
00:26:35 < BanchoBot> [http://osu.ppy.sh/u/1688846 Emperorpenguin83] achieved rank #1 on [http://osu.ppy.sh/b/1588070?m=0 Suzuki Konomi - Utaeba Soko ni Kimi ga Iru kara (TV Size) [Insane]] (osu!)
00:28:30 < BanchoBot> [http://osu.ppy.sh/u/6410878 pomroz] achieved rank #1 on [http://osu.ppy.sh/b/4500?m=0 The Village People - Y.M.C.A. [Cruisin']] (osu!)
00:35:40 -!- mode/#announce [+o Trigonoculus] by BanchoBot
```

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

3. Now create symbolic link in your website directory: `ln -s ~/irclogs/<servername> logs` and you are good to run these JS scripts :)

### About handling private channels
If you don't want to log some channels just `/part` them so irssi won't collect logs.
