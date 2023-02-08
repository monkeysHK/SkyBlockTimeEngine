/**
 * @name SkyBlockTimeEngine (ES5 Version)
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version 2.1
 */
/**
 * **SkyDate**  
 * This script translates between SkyBlock Std Time (SBST) and Coordinated Universal Time (UTC).  
 * Also supports output for Local Time (LOCAL).  
 * The main structure is from JavaScript Date.  
 * The time value is stored as a SkyDuration, which operates on SkyBlock seconds. The value is an offset from the SkyBlock Epoch (UNIX_EPOCH_SBST).  
 * Dependencies: SkyDuration  
 * Note: Users are not supposed to modify the values of this.duration and this.date directly. Only use them to read values.  
 */
function SkyDate(locale, year, monthIndex, day, hours, minutes, seconds) {
    this.setTime(locale, year, monthIndex, day, hours, minutes, seconds);
}
/*** MEMBER FUNCTIONS ***/
/**
 * setTime(duration_since_skyblock_epoch: SkyDuration)  
 * setTime(date: Date)  
 * setTime(utc_seconds_since_unix_epoch: number)  
 * setTime(date_string: string)  
 * setTime(locale?: string, year?: number, monthIndex?: number, day?: number, hours?: number, minutes?: number, seconds?: number)  
 * If first parameter is supplied with a SkyDuration instance or a number in UTC Seconds, it will be used as an offset from SKYBLOCK EPOCH.  
 * If first parameter is supplied with a text-based time notation, it will be passed to a text parser.  
 *       > (e.g. "Y189 M3 D27 00:00:00 -S" for 27th Late-Spring of Year 189)  
 *       > trailing "-U" (UTC) and "-S" (SBST) defines the locale used in calculation; default is "S"  
 * Else, all parameters will be used to determine the date.  
 * `Locale` should be h.LOCALES.utc or h.LOCALES.sbst.  
 * In the 2nd/3rd case: Specifications for all units are optional, but at least one must be present.  
 * The largest specified unit is called the Most Significant Unit (MSU):  
 *       > If a unit higher than the MSU is not specified, it will take its value in the current time.  
 *       > If a unit lower than the MSU is not specified, it will take its lowest possible value.  
 */
SkyDate.prototype.setTime = function (locale, year, monthIndex, day, hours, minutes, seconds) {
    if (locale instanceof SkyDuration) {
        this.locale = h.LOCALES.sbst;
        this.duration = locale; // note: this must be a SkyDuration since SkyBlock Epoch
    } else if (locale instanceof Date) {
        this.locale = h.LOCALES.utc;
        this.duration = this.durationFromUTCUnixTime(locale.valueOf() / 1000);
    } else if (!isNaN(locale)) {
        // If passed in a number, treat it as UTC seconds since Unix Epoch
        this.locale = h.LOCALES.utc;
        this.duration = this.durationFromUTCUnixTime(Number(locale));
    } else {
        var str = ["string", "number"].includes(typeof locale) ? String(locale) : "";
        this.locale = h.checkLocale(str) || h.LOCALES.sbst;
        var meme = [year, monthIndex, day, hours, minutes, seconds];
        var data = this.dateTextParser(str);
        var current = this.currentTime();
        var most_significant, i;
        for (i = 0; i < 6; i++) {
            if (isNaN(most_significant)) {
                if (!(isNaN(meme[i]) && isNaN(data[i])))
                    most_significant = i; // on most significant
                meme[i] = h.getFirstNumber(meme[i], data[i], current[this.locale][i]); // before/on most significant: default current
            } else {
                meme[i] = h.getFirstNumber(meme[i], data[i], h.UNIT_LIMITS[i].LOWER); // after most significant: default lowest
            }
        }
        if (this.locale === h.LOCALES.utc) {
            var ts = Date.UTC(meme[h.UNITS.year], meme[h.UNITS.month], meme[h.UNITS.day], meme[h.UNITS.hour], meme[h.UNITS.minute], meme[h.UNITS.second]) / 1000;
            this.duration = this.durationFromUTCUnixTime(ts);
        } else {
            this.duration = new SkyDuration(h.LOCALES.sbst,
                meme[h.UNITS.second] || 0, // 0-60
                meme[h.UNITS.minute] || 0, // 0-60
                meme[h.UNITS.hour] || 0, // 0-60
                meme[h.UNITS.day] - 1, // 1-31
                meme[h.UNITS.month], // 0-11
                meme[h.UNITS.year] - 1); // 1-inf
        }
        /*
        // if using non-exact date expression, and date already passed, shift to next occurence
        if ((most_significant || 0) > 0 && (this.duration.valueOf() + this.EPOCH.UNIX_TS_SBST) < (Date.now() / 1000 * h.MAGIC_RATIO)) {
            if (this.locale === h.LOCALES.utc) {
                var tempdate = getDateFromDuration(this.duration);
                tempdate["setUTC" + h.DATE_FUNC_MAP[most_significant - 1]](tempdate["getUTC" + h.DATE_FUNC_MAP[most_significant - 1]]() + 1);
                this.duration = getDurationFromUTCUnixTime(tempdate.valueOf() / 1000);
            }
            else {
                this.duration.addSBSTTime(most_significant - 1, 1);
            }
        }
        */
    }
    // UTC Date
    this.date = this.dateFromDuration(this.duration);
    // SBST Date
    this.sbstFullYear = this.duration.sbstYears + 1;
    this.sbstMonth = this.duration.sbstMonths;
    this.sbstDate = this.duration.sbstDays + 1;
    this.sbstHour = this.duration.sbstHours;
    this.sbstMinute = this.duration.sbstMinutes;
    this.sbstSecond = this.duration.sbstSeconds;
    /* Make Representations */
    // Computing Representation [fullyear, monthindex, date, hour, minute, second]
    this.computing = {
        SBST: [this.sbstFullYear, this.sbstMonth, this.sbstDate, this.sbstHour, this.sbstMinute, this.sbstSecond]
    };
    // Ordinal Dates
    this.sbstOrdinalDate = h.toOrdinal(this.sbstDate);
    this.utcOrdinalDate = h.toOrdinal(this.date.getUTCDate());
    this.localOrdinalDate = h.toOrdinal(this.date.getDate());
    // Full/Short Month
    this.sbstFullMonth = this.FULLMONTHS_SBST[this.sbstMonth];
    this.utcFullMonth = this.FULLMONTHS_UTC[this.date.getUTCMonth()];
    this.localFullMonth = this.FULLMONTHS_UTC[this.date.getMonth()];
    this.sbstShortMonth = this.SHORTMONTHS_SBST[this.sbstMonth];
    this.utcShortMonth = this.SHORTMONTHS_UTC[this.date.getUTCMonth()];
    this.localShortMonth = this.SHORTMONTHS_UTC[this.date.getMonth()];
    // ref: Date.__proto__.toDateString
    this.sbstDateString = h.getMsg("formatSBSTDate", this.sbstFullYear, this.sbstFullMonth, this.sbstDate, this.sbstOrdinalDate);
    // ref: Date.__proto__.toTimeString
    var hour12 = (this.sbstHour % 12) === 0 ? 12 : this.sbstHour % 12;
    this.sbstTimeString = h.getMsg("formatSBSTTime", hour12.toString().padStart(2, "0"),
        this.sbstMinute.toString().padStart(2, "0"), h.FMTMSG.AMPM[this.sbstHour < 12 ? 0 : 1]);
    // ref: Date.__proto__.toString
    this.sbstString = h.getMsg("formatSBSTFullDate", this.sbstDateString, this.sbstTimeString);
    // Timestamps
    this.SKYBLOCK_TS_SBST = this.duration.valueOf(); // The SKYBLOCK timestamp (seconds from SkyBlock Epoch) to this instance using SBST units
    this.SKYBLOCK_TS_UTC = Math.floor(this.duration.valueOf() / h.MAGIC_RATIO); // The SKYBLOCK timestamp (seconds from SkyBlock Epoch) to this instance using UTC units
    this.UNIX_TS_SBST = this.EPOCH.UNIX_TS_SBST + this.SKYBLOCK_TS_SBST; // The UNIX Timestamp (seconds from Unix Epoch) to this instance using SBST units
    this.UNIX_TS_UTC = this.EPOCH.UNIX_TS_UTC + this.SKYBLOCK_TS_UTC; // The UNIX Timestamp (seconds from Unix Epoch) to this instance using UTC units
    return this; // note: this.valueOf() == SKYBLOCK_TS_SBST
};
/* Setters */
SkyDate.prototype.setSBSTTimestamp = function (ts) {
    // ts in SBST seconds (not ms)!
    return this.setTime(new SkyDuration(h.LOCALES.sbst, ts));
};
SkyDate.prototype.setUTCTimestamp = function (ts) {
    // ts in UTC seconds (not ms)!
    return this.setTime(this.durationFromUTCUnixTime(ts));
};
SkyDate.prototype.addDuration = function (sbstSeconds) {
    this.duration.addSBSTTime(h.UNITS.second, sbstSeconds);
    return this.setTime(this.duration);
};
SkyDate.prototype.setSBSTTime = function (unit, value) {
    if (unit >= h.UNITS.year && unit <= h.UNITS.second)
        this.duration.addSBSTTime(unit, h.checkNumber(value) - this.computing.SBST[unit]);
    return this.setTime(this.duration);
};
SkyDate.prototype.setLocalTime = function (unit, value) {
    if (unit >= h.UNITS.year && unit <= h.UNITS.second)
        this.date["set" + h.DATE_FUNC_MAP[unit]](h.checkNumber(value));
    return this.setUTCTimestamp(this.date.valueOf() / 1000);
};
SkyDate.prototype.setUTCTime = function (unit, value) {
    if (unit >= h.UNITS.year && unit <= h.UNITS.second)
        this.date["setUTC" + h.DATE_FUNC_MAP[unit]](h.checkNumber(value));
    return this.setUTCTimestamp(this.date.valueOf() / 1000);
};
/* Tip: Use this.date to get UTC/LOCAL Time information with the JS Date */
SkyDate.prototype.valueOf = function () {
    return this.SKYBLOCK_TS_SBST; // Return the SKYBLOCK timestamp (seconds from SkyBlock Epoch) of this instance using SBST units
};
SkyDate.prototype.toString = function () {
    return this.sbstString;
};
/* Items pushed to prototype for inheritance purposes */
SkyDate.prototype.EPOCH = h.SKYBLOCK_EPOCH;
/* Helpers */
SkyDate.prototype.currentTime = function () {
    var currentDate = new Date();
    var currentDuration = (new SkyDuration(h.LOCALES.utc, Date.now() / 1000 - this.EPOCH.UNIX_TS_UTC)).computing.SBST;
    var result = {};
    result[h.LOCALES.utc] = [currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), currentDate.getUTCHours(), currentDate.getUTCMinutes(), currentDate.getUTCSeconds()];
    result[h.LOCALES.sbst] = [currentDuration[0] + 1, currentDuration[1], currentDuration[2] + 1, currentDuration[3], currentDuration[4], currentDuration[5]];
    return result;
};
SkyDate.prototype.durationFromUTCUnixTime = function (ts) {
    return new SkyDuration(h.LOCALES.utc, ts - this.EPOCH.UNIX_TS_UTC);
};
SkyDate.prototype.dateFromDuration = function (duration) {
    return new Date((duration.valueOf() / h.MAGIC_RATIO + this.EPOCH.UNIX_TS_UTC) * 1000);
};
SkyDate.prototype.matchMonth = function (str) {
    for (var i = 0; i < 12; i++) {
        if (new RegExp("\\b" + this.INPUTMONTHS_UTC[i] + "\\b", "gi").test(str) ||
            new RegExp("\\b" + this.INPUTMONTHS_SBST[i] + "\\b", "gi").test(str))
            return i;
    }
};
SkyDate.prototype.dateTextParser = function (str) {
    var match;
    return [
        (match = str.match(/(?:\s|^)Y(\d+)(?:\s|$)/i)) ? Number(match[1]) : undefined,
        (match = str.match(/(?:\s|^)M(\d+)(?:\s|$)/i)) ? Number(match[1]) - 1 : (match = str.match(/\b([A-Za-z]{2,})\b/i)) ? this.matchMonth(match[1]) : undefined,
        (match = str.match(/(?:\s|^)D(\d+)(?:\s|$)/i)) ? Number(match[1]) : undefined,
        (match = str.match(/(?:\s|^)(\d+):/)) ? Number(match[1]) : undefined,
        (match = str.match(/(?:\s|^)\d*:(\d+)/)) ? Number(match[1]) : undefined,
        (match = str.match(/(?:\s|^)\d*:\d*:(\d+)/)) ? Number(match[1]) : undefined
    ];
};
/* Data */
SkyDate.prototype.INPUTMONTHS_UTC = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];
SkyDate.prototype.INPUTMONTHS_SBST = [
    "ESP", "SP", "LSP", "ESU", "SU", "LSU", "EAU", "AU", "LAU", "EWI", "WI", "LWI"
];
SkyDate.prototype.SHORTMONTHS_UTC = h.FMTMSG.SHORTMONTHS_UTC;
SkyDate.prototype.SHORTMONTHS_SBST = h.FMTMSG.SHORTMONTHS_SBST;
SkyDate.prototype.FULLMONTHS_UTC = h.FMTMSG.FULLMONTHS_UTC;
SkyDate.prototype.FULLMONTHS_SBST = h.FMTMSG.FULLMONTHS_SBST;
/**
 * Pushed static members from previous editions into prototype
 * in favour of customizability using inheritance.
 **/