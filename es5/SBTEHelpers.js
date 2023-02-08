/**
 * @name SkyBlockTimeEngine (ES5 Version)
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version 2.1
 */
/**
 * **SBTEHelpers**
 * Constants and Helpers for all other classes  
 * Please load these before using the other files.  
 */

var h = {
    FMTMSG: {
        formatYears: "$1y",
        formatMonths: "$1mo",
        formatDays: "$1d",
        format72th: "[+$1/72s]",
        formatTime: "$1:$2:$3 $4", // placement: [H, M, S, S_72TH]
        formatFullDuration: "$1 $2 $3 $4", // placement: [Y, MO, D, TIME]
        formatSBSTDate: "$4 $2 Y$1", // placement: [full year, full month, date number, ordinal date]
        formatSBSTTime: "$1:$2 $3", // placement: [hour, minute, am/pm]
        formatSBSTFullDate: "$1, $2", // placement: [date string, time string]
        AMPM: ["AM", "PM"],
        SHORTMONTHS_UTC: [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
        ],
        SHORTMONTHS_SBST: [
            "ESP", "SP", "LSP", "ESU", "SU", "LSU", "EAU", "AU", "LAU", "EWI", "WI", "LWI"
        ],
        FULLMONTHS_UTC: [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ],
        FULLMONTHS_SBST: [
            "Early Spring", "Spring", "Late Spring", "Early Summer", "Summer", "Late Summer",
            "Early Autumn", "Autumn", "Late Autumn", "Early Winter", "Winter", "Late Winter"
        ],
    },
    LOCALES: {
        utc: "U",
        sbst: "S",
        utc_regex: /(?:\s|^)\-u$/i,
        sbst_regex: /(?:\s|^)\-s$/i
    },
    UNITS: {
        year: 0,
        month: 1,
        day: 2,
        hour: 3,
        minute: 4,
        second: 5
    },
    RATIOS: {
        5: 1, // one second
        4: 60, // minute-to-second ratio
        3: 3600, // hour-to-second ratio
        2: 86400, // day-to-second ratio
        1: 2678400, // month-to-second (=31 days) ratio
        0: 32140800 // year-to-second (=372 days) ratio
    },
    MAGIC_RATIO: 72,
    DATE_FUNC_MAP: [
        "FullYear",
        "Month",
        "Date",
        "Hours",
        "Minutes",
        "Seconds"
    ],
    UNIT_LIMITS: [
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
    ],
    STATES: {
        WAITING: 0,
        ONGOING: 1,
        STOPPED: 2
    },
    checkNumber: function (n) {
        if (isNaN(n))
            throw new TypeError("Input must be a number");
        return Number(n);
    },
    checkLocale: function (str) {
        if (typeof str === "string" && (str === h.LOCALES.utc || h.LOCALES.utc_regex.test(str)))
            return h.LOCALES.utc;
        else if (typeof str === "string" && (str === h.LOCALES.sbst || h.LOCALES.sbst_regex.test(str)))
            return h.LOCALES.sbst;
        return false;
    },
    getMsg: function ( /* ...arguments */ ) {
        var m = h.FMTMSG[arguments[0]];
        if (!m)
            return "<msg." + arguments[0] + ">";
        for (var i = 1; i < arguments.length; i++)
            m = m.replaceAll("$" + i, arguments[i]);
        return m;
    },
    fmtTime: function (hrs, m, s, s_72th) {
        return h.getMsg("formatTime", String(hrs).padStart(2, 0), String(m).padStart(2, 0), String(s).padStart(2, 0),
            (s_72th ? h.getMsg("format72th", s_72th) : "")).trim();
    },
    fmtFullDuration: function (y, mo, d, hrs, m, s, s_72th) {
        return h.getMsg("formatFullDuration", y !== 0 ? h.getMsg("formatYears", y) : "",
            mo !== 0 ? h.getMsg("formatMonths", mo) : "",
            d !== 0 ? h.getMsg("formatDays", d) : "",
            h.fmtTime(hrs, m, s, s_72th)).replaceAll(/\s{2,}/g, " ").trim();
    },
    toOrdinal: function (num) {
        return num + (num >= 11 && num <= 13 ? "th" : num % 10 === 1 ? "st" : num % 10 === 2 ? "nd" : num % 10 === 3 ? "rd" : "th");
    },
    getFirstNumber: function ( /* ...arguments */ ) {
        for (var i in arguments) {
            if (!isNaN(arguments[i]))
                return Number(arguments[i]);
        }
    }
};
h.SKYBLOCK_EPOCH = {
    UNIX_TS_UTC: 1560275700,
    UNIX_TS_SBST: 1560275700 * h.RATIOS.magic,
    SKYBLOCK_TS_UTC: 0,
    SKYBLOCK_TS_SBST: 0
};
h.ALPHA_SKYBLOCK_EPOCH = {
    UNIX_TS_UTC: 1560275700 - 211680,
    UNIX_TS_SBST: (1560275700 - 211680) * h.RATIOS.magic,
    SKYBLOCK_TS_UTC: 0,
    SKYBLOCK_TS_SBST: 0
};