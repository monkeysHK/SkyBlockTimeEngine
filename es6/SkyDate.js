/**
 * @name SkyBlockTimeEngine (ES6 Version)
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version beta_2
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
class SkyDate {
    constructor(locale, year, monthIndex, day, hours, minutes, seconds) {
        this.setTime(locale, year, monthIndex, day, hours, minutes, seconds);
    }
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
     * `Locale` should be LOCALES.utc or LOCALES.sbst.  
     * In the 2nd/3rd case: Specifications for all units are optional, but at least one must be present.  
     * The largest specified unit is called the Most Significant Unit (MSU):  
     *       > If a unit higher than the MSU is not specified, it will take its value in the current time.  
     *       > If a unit lower than the MSU is not specified, it will take its lowest possible value.  
     */
    setTime(locale, year, monthIndex, day, hours, minutes, seconds) {
        if (locale instanceof SkyDuration) {
            this.locale = LOCALES.sbst;
            this.duration = locale; // note: this must be a SkyDuration since SkyBlock Epoch
        } else if (locale instanceof Date) {
            this.locale = LOCALES.utc;
            this.duration = getDurationFromUTCUnixTime(locale.valueOf() / 1000);
        } else if (!isNaN(locale)) {
            // If passed in a number, treat it as UTC seconds since Unix Epoch
            this.locale = LOCALES.utc;
            this.duration = getDurationFromUTCUnixTime(Number(locale));
        } else {
            let str = ["string", "number"].includes(typeof locale) ? String(locale) : "";
            this.locale = checkLocale(str) || LOCALES.sbst;
            let meme = [year, monthIndex, day, hours, minutes, seconds];
            let data = SkyDate.dateTextParser(str);
            let current = SkyDate.currentTime();
            let most_significant, i;
            for (i = 0; i < 6; i++) {
                if (isNaN(most_significant)) {
                    if (!(isNaN(meme[i]) && isNaN(data[i])))
                        most_significant = i; // on most significant
                    meme[i] = getFirstNumber(meme[i], data[i], current[this.locale][i]); // before/on most significant: default current
                } else {
                    meme[i] = getFirstNumber(meme[i], data[i], UNIT_LIMITS[i].LOWER); // after most significant: default lowest
                }
            }
            if (this.locale === LOCALES.utc) {
                let ts = Date.UTC(meme[UNITS.year], meme[UNITS.month], meme[UNITS.day], meme[UNITS.hour], meme[UNITS.minute], meme[UNITS.second]) / 1000;
                this.duration = getDurationFromUTCUnixTime(ts);
            } else {
                this.duration = new SkyDuration(LOCALES.sbst,
                    meme[UNITS.second] || 0, // 0-60
                    meme[UNITS.minute] || 0, // 0-60
                    meme[UNITS.hour] || 0, // 0-60
                    meme[UNITS.day] - 1, // 1-31
                    meme[UNITS.month], // 0-11
                    meme[UNITS.year] - 1); // 1-inf
            }
            /*
            // if using non-exact date expression, and date already passed, shift to next occurence
            if ((most_significant || 0) > 0 && (this.duration.valueOf() + SKYBLOCK_EPOCH.UNIX_TS_SBST) < (Date.now() / 1000 * RATIOS.magic)) {
                if (this.locale === LOCALES.utc) {
                    var tempdate = getDateFromDuration(this.duration);
                    tempdate["setUTC" + DATE_FUNC_MAP[most_significant - 1]](tempdate["getUTC" + DATE_FUNC_MAP[most_significant - 1]]() + 1);
                    this.duration = getDurationFromUTCUnixTime(tempdate.valueOf() / 1000);
                }
                else {
                    this.duration.addSBSTTime(most_significant - 1, 1);
                }
            }
            */
        }
        // UTC Date
        this.date = getDateFromDuration(this.duration);
        // SKYBLOCK Date
        this.sbstFullYear = this.duration.sbstYears + 1;
        this.sbstMonth = this.duration.sbstMonths;
        this.sbstDate = this.duration.sbstDays + 1;
        this.sbstHour = this.duration.sbstHours;
        this.sbstMinute = this.duration.sbstMinutes;
        this.sbstSecond = this.duration.sbstSeconds;
        /* Make Representations */
        // Computing Representation [fullyear, monthindex, date, hour, minute, second]
        this.computing = {};
        this.computing.SBST = [this.sbstFullYear, this.sbstMonth, this.sbstDate, this.sbstHour, this.sbstMinute, this.sbstSecond];
        // Ordinal Dates
        this.sbstOrdinalDate = SkyDate.toOrdinal(this.sbstDate);
        this.utcOrdinalDate = SkyDate.toOrdinal(this.date.getUTCDate());
        this.localOrdinalDate = SkyDate.toOrdinal(this.date.getDate());
        // Full/Short Month
        this.sbstFullMonth = SkyDate.FULLMONTHS_SBST[this.sbstMonth];
        this.utcFullMonth = SkyDate.FULLMONTHS_UTC[this.date.getUTCMonth()];
        this.localFullMonth = SkyDate.FULLMONTHS_UTC[this.date.getMonth()];
        this.sbstShortMonth = SkyDate.SHORTMONTHSB[this.sbstMonth];
        this.utcShortMonth = SkyDate.SHORTMONTHRL[this.date.getUTCMonth()];
        this.localShortMonth = SkyDate.SHORTMONTHRL[this.date.getMonth()];
        // ref: Date.__proto__.toDateString
        this.sbstDateString = this.sbstOrdinalDate + " " + this.sbstFullMonth + " Y" + this.sbstFullYear;
        // ref: Date.__proto__.toTimeString
        this.sbstTimeString = SkyDate.to12HourTime(this.sbstHour, this.sbstMinute);
        // ref: Date.__proto__.toString
        this.sbstString = this.sbstDateString + ", " + this.sbstTimeString;
        // Timestamps
        this.SKYBLOCK_TS_SBST = this.duration.valueOf(); // The SKYBLOCK timestamp (seconds from SkyBlock Epoch) to this instance using SBST units
        this.SKYBLOCK_TS_UTC = Math.floor(this.duration.valueOf() / RATIOS.magic); // The SKYBLOCK timestamp (seconds from SkyBlock Epoch) to this instance using UTC units
        this.UNIX_TS_SBST = SKYBLOCK_EPOCH.UNIX_TS_SBST + this.SKYBLOCK_TS_SBST; // The UNIX Timestamp (seconds from Unix Epoch) to this instance using SBST units
        this.UNIX_TS_UTC = SKYBLOCK_EPOCH.UNIX_TS_UTC + this.SKYBLOCK_TS_UTC; // The UNIX Timestamp (seconds from Unix Epoch) to this instance using UTC units
        return this; // note: this.valueOf() == SKYBLOCK_TS_SBST
    }
    /* Setters */
    setUTCTimestamp(ts) {
        // ts in UTC seconds (not ms)!
        return this.setTime(getDurationFromUTCUnixTime(ts));
    }
    setSBSTTimestamp(ts) {
        // ts in SBST seconds (not ms)!
        return this.setTime(new SkyDuration(LOCALES.sbst, ts));
    }
    addDuration(sbstSeconds) {
        this.duration.addSBSTTime(UNITS.second, sbstSeconds);
        return this.setTime(this.duration);
    }
    setSBSTTime(unit, value) {
        if (unit >= UNITS.year && unit <= UNITS.second)
            this.duration.addSBSTTime(unit, checkNumber(value) - this.computing.SBST[unit]);
        return this.setTime(this.duration);
    }
    setLocalTime(unit, value) {
        if (unit >= UNITS.year && unit <= UNITS.second)
            this.date["set" + DATE_FUNC_MAP[unit]](checkNumber(value));
        return this.setUTCTimestamp(this.date.valueOf() / 1000);
    }
    setUTCTime(unit, value) {
        if (unit >= UNITS.year && unit <= UNITS.second)
            this.date["setUTC" + DATE_FUNC_MAP[unit]](checkNumber(value));
        return this.setUTCTimestamp(this.date.valueOf() / 1000);
    }
    /* Tip: Use this.date to get UTC/LOCAL Time information with the JS Date */
    valueOf() {
        return this.SKYBLOCK_TS_SBST; // Return the SKYBLOCK timestamp (seconds from SkyBlock Epoch) of this instance using SBST units
    }
    toString() {
        return this.sbstString;
    }
    /*** STATIC ***/
    static currentTime() {
        let currentDate = new Date();
        let currentDuration = (new SkyDuration(LOCALES.utc, Date.now() / 1000 - SKYBLOCK_EPOCH.UNIX_TS_UTC)).computing.SBST;
        let result = {};
        result[LOCALES.utc] = [currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), currentDate.getUTCHours(), currentDate.getUTCMinutes(), currentDate.getUTCSeconds()];
        result[LOCALES.sbst] = [currentDuration[0] + 1, currentDuration[1], currentDuration[2] + 1, currentDuration[3], currentDuration[4], currentDuration[5], currentDuration[6]];
        return result;
    }
    static matchMonth(str) {
        for (let i = 0; i < 12; i++) {
            if (new RegExp("\\b" + SkyDate.FULLMONTHS_UTC[i] + "\\b", "gi").test(str) ||
                new RegExp("\\b" + SkyDate.SHORTMONTHRL[i] + "\\b", "gi").test(str) ||
                new RegExp("\\b" + SkyDate.FULLMONTHS_SBST[i] + "\\b", "gi").test(str) ||
                new RegExp("\\b" + SkyDate.SHORTMONTHSB[i] + "\\b", "gi").test(str))
                return i;
        }
    }
    static dateTextParser(str) {
        let match;
        return [
            (match = str.match(/(?:\s|^)Y(\d+)(?:\s|$)/i)) ? Number(match[1]) : undefined,
            (match = str.match(/(?:\s|^)M(\d+)(?:\s|$)/i)) ? Number(match[1]) - 1 : (match = str.match(/\b([A-Za-z]{2,})\b/i)) ? SkyDate.matchMonth(match[1]) : undefined,
            (match = str.match(/(?:\s|^)D?(\d+)(?:\s|$)/i)) ? Number(match[1]) : undefined,
            (match = str.match(/(?:\s|^)(\d+):/)) ? Number(match[1]) : undefined,
            (match = str.match(/(?:\s|^)\d*:(\d+)/)) ? Number(match[1]) : undefined,
            (match = str.match(/(?:\s|^)\d*:\d*:(\d+)/)) ? Number(match[1]) : undefined
        ];
    }
    static toOrdinal(num) {
        return num + (num >= 11 && num <= 13 ? "th" : num % 10 === 1 ? "st" : num % 10 === 2 ? "nd" : num % 10 === 3 ? "rd" : "th");
    }
    static to12HourTime(hour, min) {
        const ampm = hour < 12 ? "AM" : "PM";
        hour = (hour % 12) === 0 ? 12 : hour % 12;
        return (hour.toString().padStart(2, "0")) + ":" + (min.toString().padStart(2, "0")) + ampm;
    }
    static FULLMONTHS_UTC = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    static SHORTMONTHRL = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    static FULLMONTHS_SBST = [
        "Early Spring", "Spring", "Late Spring", "Early Summer", "Summer", "Late Summer",
        "Early Autumn", "Autumn", "Late Autumn", "Early Winter", "Winter", "Late Winter"
    ];
    static SHORTMONTHSB = [
        "ESP", "SP", "LSP", "ESU", "SU", "LSU", "EAU", "AU", "LAU", "EWI", "WI", "LWI"
    ];
    static UNIXTIME_TO_SBEPOCH_UTC = 1560275700; // The UNIX Timestamp (seconds from Unix Epoch) to SkyBlock Epoch using UTC units
    static UNIXTIME_TO_SBEPOCH_SBST = 1560275700 * RATIOS.magic; // The UNIX Timestamp (seconds from Unix Epoch) to SkyBlock Epoch using SBST units
}