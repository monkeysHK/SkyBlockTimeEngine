/**
 * @name SkyBlockTimeEngine (ES6 Version)
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version beta_2
 */
/**
 * **SkyDuration**  
 * This script translates between SkyBlock Durations and UTC Durations,  
 * and allow arithmetic to be performed on them.  
 */
class SkyDuration {
    constructor(locale, seconds, minutes, hours, days, months, years) {
        this.setDuration(locale, seconds, minutes, hours, days, months, years);
    }
    /**
     * setTime(utc_seconds: number)  
     * setTime(duration_string: string)  
     * setTime(locale?: string, seconds?: number, minutes?: number, hours?: number, days?: number, months?: number, years?: number)  
     * Due to different months having different number of days, UTC Time does not support Months and Years  
     * If first parameter is supplied with a number in UTC Seconds, it will define the duration.  
     * If first parameter is supplied with a text-based time notation, it will be passed to a text parser.  
     *       > (e.g. "2y 3mo 1d 3h 2m 50s -U")  
     *       > trailing "-U" (UTC) and "-S" (SBST) defines the locale used in calculation; default is "S"  
     * Else, all parameters will be used to determine the duration.  
     * `Locale` should be LOCALES.utc or LOCALES.sbst.  
     */
    setDuration(locale, seconds, minutes, hours, days, months, years) {
        // Determine Duration in SBST Seconds
        let str = ["string", "number"].includes(typeof locale) && String(locale) || "";
        let duration = 0;
        if (!isNaN(str)) {
            // If passed in a number, treat it as UTC seconds
            this.locale = LOCALES.utc;
            duration = Number(str) * RATIOS.magic;
        } else {
            // Else, parse time string
            this.locale = checkLocale(str) || LOCALES.sbst;
            let data = SkyDuration.durationTextParser(str);
            if (!Object.values(data).every(isNaN)) {
                duration = (data[UNITS.second] || 0) + (data[UNITS.minute] || 0) * RATIOS[UNITS.minute] + (data[UNITS.hour] || 0) * RATIOS[UNITS.hour] + (data[UNITS.day] || 0) * RATIOS[UNITS.day];
                if (this.locale === LOCALES.sbst)
                    duration += (data[UNITS.month] || 0) * RATIOS[UNITS.month] + (data[UNITS.year] || 0) * RATIOS[UNITS.year]; // month/year support for SBST
                else
                    duration *= RATIOS.magic; // Force duration value in SkyBlock seconds
            } else {
                // Add individual values passed to function
                duration = (seconds || 0) + (minutes || 0) * RATIOS[UNITS.minute] + (hours || 0) * RATIOS[UNITS.hour] + (days || 0) * RATIOS[UNITS.day];
                if (this.locale === LOCALES.sbst)
                    duration += (months || 0) * RATIOS[UNITS.month] + (years || 0) * RATIOS[UNITS.year]; // month/year support for SBST
                else
                    duration *= RATIOS.magic; // Force duration value in SkyBlock seconds
            }
        }
        this.duration = Math.floor(duration);
        // SKYBLOCK Duration Calculations
        this.sbstSeconds = this.duration % RATIOS[UNITS.minute];
        this.sbstMinutes = Math.floor(this.duration % RATIOS[UNITS.hour] / RATIOS[UNITS.minute]);
        this.sbstHours = Math.floor(this.duration % RATIOS[UNITS.day] / RATIOS[UNITS.hour]);
        this.sbstDays = Math.floor(this.duration % RATIOS[UNITS.month] / RATIOS[UNITS.day]);
        this.sbstMonths = Math.floor(this.duration % RATIOS[UNITS.year] / RATIOS[UNITS.month]);
        this.sbstYears = Math.floor(this.duration / RATIOS[UNITS.year]);
        // UTC Duration Calculations
        this.utc72thSecs = this.duration % RATIOS.magic;
        var totalUtcSecs = Math.floor(this.duration / RATIOS.magic);
        this.utcSeconds = totalUtcSecs % RATIOS[UNITS.minute];
        this.utcMinutes = Math.floor(totalUtcSecs % RATIOS[UNITS.hour] / RATIOS[UNITS.minute]);
        this.utcHours = Math.floor(totalUtcSecs % RATIOS[UNITS.day] / RATIOS[UNITS.hour]);
        this.utcDays = Math.floor(totalUtcSecs / RATIOS[UNITS.day]);
        // Representations
        // Computing Representation [years, months, days, hours, minutes, seconds]
        this.computing = {};
        this.computing.SBST = [this.sbstYears, this.sbstMonths, this.sbstDays, this.sbstHours, this.sbstMinutes, this.sbstSeconds];
        // Time Strings
        this.utcString = [
            this.utcDays !== 0 ? String(this.utcDays) + "d" : null,
            fmtTime(this.utcHours, this.utcMinutes, this.utcSeconds, this.utc72thSecs)
        ].filter(Boolean).join(" ");
        this.sbstString = [
            this.sbstYears !== 0 ? String(this.sbstYears) + "y" : null,
            this.sbstMonths !== 0 ? String(this.sbstMonths) + "m" : null,
            this.sbstDays !== 0 ? String(this.sbstDays) + "d" : null,
            fmtTime(this.sbstHours, this.sbstMinutes, this.sbstSeconds)
        ].filter(Boolean).join(" ");
        return this;
    }
    toString() {
        return this.utcString + " (in UTC Duration), " + this.sbstString + " (in SBST Duration)";
    }
    valueOf() {
        return this.duration;
    }
    addUTCTime(unit, value) {
        if (unit >= UNITS.day && unit <= UNITS.second)
            this.addSBSTTime(UNITS.second, checkNumber(value) * RATIOS[unit] * RATIOS.magic);
        return this;
    }
    addSBSTTime(unit, value) {
        if (unit >= UNITS.year && unit <= UNITS.second)
            this.setDuration(LOCALES.sbst, this.valueOf() + checkNumber(value));
        return this;
    }
    static durationTextParser(str) {
        let match;
        return [
            (match = str.match(/(?:\s|^)(\d+)y(?:\s|$)/i)) ? Number(match[1]) : undefined,
            (match = str.match(/(?:\s|^)(\d+)mo(?:\s|$)/i)) ? Number(match[1]) : undefined,
            (match = str.match(/(?:\s|^)(\d+)d(?:\s|$)/i)) ? Number(match[1]) : undefined,
            (match = str.match(/(?:\s|^)(\d+)h(?:\s|$)/i)) ? Number(match[1]) : undefined,
            (match = str.match(/(?:\s|^)(\d+)m(?:\s|$)/i)) ? Number(match[1]) : undefined,
            (match = str.match(/(?:\s|^)(\d+)s(?:\s|$)/i)) ? Number(match[1]) : undefined,
        ]
    }
}