/**
 * @name SkyBlockTimeEngine (ES6 Version)
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version beta_2
 */
/**
 * **SBTEHelpers**
 * Constants and Helpers for all other classes  
 * Please load these before using the other files.  
 */

const LOCALES = {
    utc: "U",
    sbst: "S",
    utc_regex: /(?:\s|^)\-u$/i,
    sbst_regex: /(?:\s|^)\-s$/i
};
const UNITS = {
    year: 0,
    month: 1,
    day: 2,
    hour: 3,
    minute: 4,
    second: 5
};
const RATIOS = {
    5: 1, // one second
    4: 60, // minute-to-second ratio
    3: 3600, // hour-to-second ratio
    2: 86400, // day-to-second ratio
    1: 2678400, // month-to-second (=31 days) ratio
    0: 32140800, // year-to-second (=372 days) ratio
    magic: 72 // magic ratio
};
const SKYBLOCK_EPOCH = {
    UNIX_TS_UTC: 1560275700,
    UNIX_TS_SBST: 1560275700 * RATIOS.magic,
    SKYBLOCK_TS_UTC: 0,
    SKYBLOCK_TS_SBST: 0
};
const DATE_FUNC_MAP = [
    "FullYear",
    "Month",
    "Date",
    "Hours",
    "Minutes",
    "Seconds"
];
const UNIT_LIMITS = [
    // note: VALUE in [LOWER, UPPER)
    {
        LOWER: 0,
        UPPER: undefined
    },
    {
        LOWER: 0,
        UPPER: 12
    },
    {
        LOWER: 1,
        UPPER: 32
    },
    {
        LOWER: 0,
        UPPER: 24
    },
    {
        LOWER: 0,
        UPPER: 60
    },
    {
        LOWER: 0,
        UPPER: 60
    }
];
const STATES = {
    WAITING: 0,
    ONGOING: 1,
    STOPPED: 2
};

function checkNumber(n) {
    if (isNaN(n))
        throw new TypeError("Input must be a number");
    return Number(n);
}

function checkLocale(str) {
    if (typeof str === "string" && (str == LOCALES.utc || LOCALES.utc_regex.test(str)))
        return LOCALES.utc;
    else if (typeof str === "string" && (str == LOCALES.sbst || LOCALES.sbst_regex.test(str)))
        return LOCALES.sbst;
    return false;
}

function fmtTime(h, m, s, s_72th) {
    return String(h).padStart(2, 0) + ":" + String(m).padStart(2, 0) + ":" + String(s).padStart(2, 0) +
        (s_72th ? "[+" + s_72th + "/72s]" : "");
}

function getFirstNumber( /* ...arguments */ ) {
    for (let i in arguments) {
        if (!isNaN(arguments[i]))
            return Number(arguments[i]);
    }
}

function getDurationFromUTCUnixTime(ts) {
    return new SkyDuration(LOCALES.utc, ts - SKYBLOCK_EPOCH.UNIX_TS_UTC)
}

function getDateFromDuration(duration) {
    return new Date((duration.valueOf() / RATIOS.magic + SKYBLOCK_EPOCH.UNIX_TS_UTC) * 1000);
}