"use strict";
exports.port = 8e3;
exports.bindaddress = "0.0.0.0";
exports.wsdeflate = null;
exports.lazysockets = false;
exports.ssl = null;
exports.proxyip = false;
exports.subprocesses = {
  /**
   * network - the number of networking child processes to spawn
   *   This should be no greater than the number of threads available on your
   *   server's CPU. If you're not sure how many you have, you can check from a
   *   terminal by running:
   *
   *   $ node -e "console.log(require('os').cpus().length)"
   *
   *   Using more workers than there are available threads will cause performance
   *   issues. Keeping a couple threads available for use for OS-related work and
   *   other PS processes will likely give you the best performance, if your
   *   server's CPU is capable of multithreading. If you don't know what any of
   *   this means or you are unfamiliar with PS' networking code, leave this set
   *   to 1.
   */
  network: 1,
  /**
   * for simulating battles
   *   You should leave this at 1 unless your server has a very large
   *   amount of traffic (i.e. hundreds of concurrent battles).
   */
  simulator: 1,
  // beyond this point, it'd be very weird if you needed more than one of each of these
  /** for validating teams */
  validator: 1,
  /** for user authentication */
  verifier: 1,
  localartemis: 1,
  remoteartemis: 1,
  friends: 1,
  chatdb: 1,
  modlog: 1,
  pm: 1,
  /** for the battlesearch chat plugin */
  battlesearch: 1,
  /** datasearch - for the datasearch chat plugin */
  datasearch: 1
};
exports.ofemain = false;
exports.ofesockets = false;
exports.debugsimprocesses = true;
exports.debugvalidatorprocesses = true;
exports.debugdexsearchprocesses = true;
exports.potd = "";
exports.crashguard = true;
exports.loginserver = "http://play.pokemonshowdown.com/";
exports.loginserverkeyalgo = "RSA-SHA1";
exports.loginserverpublickeyid = 4;
exports.loginserverpublickey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzfWKQXg2k8c92aiTyN37
dl76iW0aeAighgzeesdar4xZT1A9yzLpj2DgR8F8rh4R32/EVOPmX7DCf0bYWeh3
QttP0HVKKKfsncJZ9DdNtKj1vWdUTklH8oeoIZKs54dwWgnEFKzb9gxqu+z+FJoQ
vPnvfjCRUPA84O4kqKSuZT2qiWMFMWNQPXl87v+8Atb+br/WXvZRyiLqIFSG+ySn
Nwx6V1C8CA1lYqcPcTfmQs+2b4SzUa8Qwkr9c1tZnXlWIWj8dVvdYtlo0sZZBfAm
X71Rsp2vwEleSFKV69jj+IzAfNHRRw+SADe3z6xONtrJOrp+uC/qnLNuuCfuOAgL
dnUVFLX2aGH0Wb7ZkriVvarRd+3otV33A8ilNPIoPb8XyFylImYEnoviIQuv+0VW
RMmQlQ6RMZNr6sf9pYMDhh2UjU11++8aUxBaso8zeSXC9hhp7mAa7OTxts1t3X57
72LqtHHEzxoyLj/QDJAsIfDmUNAq0hpkiRaXb96wTh3IyfI/Lqh+XmyJuo+S5GSs
RhlSYTL4lXnj/eOa23yaqxRihS2MT9EZ7jNd3WVWlWgExIS2kVyZhL48VA6rXDqr
Ko0LaPAMhcfETxlFQFutoWBRcH415A/EMXJa4FqYa9oeXWABNtKkUW0zrQ194btg
Y929lRybWEiKUr+4Yw2O1W0CAwEAAQ==
-----END PUBLIC KEY-----
`;
exports.routes = {
  root: "pokemonshowdown.com",
  client: "play.pokemonshowdown.com",
  dex: "dex.pokemonshowdown.com",
  replays: "replay.pokemonshowdown.com"
};
exports.crashguardemail = null;
exports.disablebasicnamefilter = false;
exports.allowrequestingties = true;
exports.reportjoins = true;
exports.reportjoinsperiod = 0;
exports.reportbattles = true;
exports.reportbattlejoins = true;
exports.monitorminpunishments = 3;
exports.nothrottle = false;
exports.noipchecks = false;
exports.nobattlesearch = false;
exports.punishmentautolock = false;
exports.restrictLinks = false;
exports.chatmodchat = false;
exports.battlemodchat = false;
exports.pmmodchat = false;
exports.laddermodchat = false;
exports.forcetimer = false;
exports.forceregisterelo = false;
exports.backdoor = true;
exports.consoleips = ["127.0.0.1"];
exports.watchconfig = true;
exports.logchat = false;
exports.logchallenges = false;
exports.loguserstats = 1e3 * 60 * 10;
exports.inactiveuserthreshold = 1e3 * 60 * 60;
exports.autolockdown = true;
exports.noguestsecurity = false;
exports.tourroom = "";
exports.tourannouncements = [
  /* roomids */
];
exports.tourdefaultplayercap = 0;
exports.ratedtours = false;
exports.appealurl = "";
exports.repl = true;
exports.replsocketprefix = "./logs/repl/";
exports.replsocketmode = 384;
exports.disablehotpatchall = false;
exports.forcedpublicprefixes = [];
exports.startuphook = function() {
};
exports.lastfmkey = "";
exports.chatlogreader = "fs";
exports.grouplist = [
  {
    symbol: "~",
    id: "admin",
    name: "Administrator",
    inherit: "@",
    jurisdiction: "u",
    globalonly: true,
    console: true,
    bypassall: true,
    lockdown: true,
    promote: "~u",
    roomowner: true,
    roombot: true,
    roommod: true,
    roomdriver: true,
    forcewin: true,
    declare: true,
    addhtml: true,
    rangeban: true,
    makeroom: true,
    editroom: true,
    editprivacy: true,
    potd: true,
    disableladder: true,
    gdeclare: true,
    gamemanagement: true,
    exportinputlog: true,
    tournaments: true
  },
  {
    symbol: "#",
    id: "owner",
    name: "Room Owner",
    inherit: "@",
    jurisdiction: "u",
    roomonly: true,
    roombot: true,
    roommod: true,
    roomdriver: true,
    roomprizewinner: true,
    editroom: true,
    declare: true,
    addhtml: true,
    gamemanagement: true,
    tournaments: true
  },
  {
    symbol: "\u2605",
    id: "host",
    name: "Host",
    inherit: "@",
    jurisdiction: "u",
    roomonly: true,
    declare: true,
    modchat: "a",
    gamemanagement: true,
    forcewin: true,
    tournaments: true,
    joinbattle: true
  },
  {
    symbol: "@",
    id: "mod",
    name: "Moderator",
    inherit: "%",
    jurisdiction: "u",
    globalban: true,
    ban: true,
    modchat: "a",
    roomvoice: true,
    roomwhitelist: true,
    forcerename: true,
    ip: true,
    alts: "@u",
    game: true
  },
  {
    symbol: "%",
    id: "driver",
    name: "Driver",
    inherit: "+",
    jurisdiction: "u",
    globalGroupInPersonalRoom: "@",
    announce: true,
    warn: "\u2605u",
    kick: true,
    mute: "\u2605u",
    lock: true,
    forcerename: true,
    timer: true,
    modlog: true,
    alts: "%u",
    bypassblocks: "u%@~",
    receiveauthmessages: true,
    gamemoderation: true,
    jeopardy: true,
    joinbattle: true,
    minigame: true,
    modchat: true,
    hiderank: true
  },
  {
    // Bots are ranked below Driver/Mod so that Global Bots can be kept out
    // of modjoin % rooms (namely, Staff).
    // (They were previously above Driver/Mod so they can have game management
    // permissions drivers don't, but these permissions can be manually given.)
    symbol: "*",
    id: "bot",
    name: "Bot",
    inherit: "%",
    jurisdiction: "u",
    addhtml: true,
    tournaments: true,
    declare: true,
    bypassafktimer: true,
    gamemanagement: true,
    ip: false,
    globalban: false,
    lock: false,
    forcerename: false,
    alts: false
  },
  {
    symbol: "\u2606",
    id: "player",
    name: "Player",
    inherit: "+",
    battleonly: true,
    roomvoice: true,
    modchat: true,
    editprivacy: true,
    gamemanagement: true,
    joinbattle: true,
    nooverride: true
  },
  {
    symbol: "+",
    id: "voice",
    name: "Voice",
    inherit: " ",
    altsself: true,
    makegroupchat: true,
    joinbattle: true,
    show: true,
    showmedia: true,
    exportinputlog: true,
    importinputlog: true
  },
  {
    symbol: "^",
    id: "prizewinner",
    name: "Prize Winner",
    roomonly: true
  },
  {
    symbol: "whitelist",
    id: "whitelist",
    name: "Whitelist",
    inherit: " ",
    roomonly: true,
    altsself: true,
    show: true,
    showmedia: true,
    exportinputlog: true,
    importinputlog: true
  },
  {
    symbol: " ",
    ipself: true
  },
  {
    name: "Locked",
    id: "locked",
    symbol: "\u203D",
    punishgroup: "LOCK"
  },
  {
    name: "Muted",
    id: "muted",
    symbol: "!",
    punishgroup: "MUTE"
  }
];
