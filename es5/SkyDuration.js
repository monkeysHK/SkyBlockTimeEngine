/**
 * @name SkyBlockTimeEngine (ES5 Version)
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version 2.0
 */
/**
 * **SkyDuration**  
 * This script translates between SkyBlock Durations and UTC Durations,  
 * and allow arithmetic to be performed on them.  
 */
function SkyDuration(locale, seconds, minutes, hours, days, months, years) {
    this.setDuration(locale, seconds, minutes, hours, days, months, years);
}
/*** MEMBER FUNCTIONS ***/
/**
 * setDuration(utc_seconds: number)  
 * setDuration(duration_string: string)  
 * setDuration(locale?: string, seconds?: number, minutes?: number, hours?: number, days?: number, months?: number, years?: number)  
 * Due to different months having different number of days, UTC Time does not support Months and Years  
 * If first parameter is supplied with a number in UTC Seconds, it will define the duration.  
 * If first parameter is supplied with a text-based time notation, it will be passed to a text parser.  
 *       > (e.g. "2y 3mo 1d 3h 2m 50s -U")  
 *       > trailing "-U" (UTC) and "-S" (SBST) defines the locale used in calculation; default is "S"  
 * Else, all parameters will be used to determine the duration.  
 * `Locale` should be h.LOCALES.utc or h.LOCALES.sbst.  
 */
SkyDuration.prototype.setDuration = function(locale, seconds, minutes, hours, days, months, years) {
    // Determine Duration in SBST Seconds
    var str = ["string", "number"].includes(typeof locale) && String(locale) || "";
    var duration = 0;
    if (!isNaN(str)) {
        // If passed in a number, treat it as UTC seconds
        this.locale = h.LOCALES.utc;
        duration = Number(str) * h.RATIOS.magic;
    } else {
        // Else, parse time string
        this.locale = h.checkLocale(str) || h.LOCALES.sbst;
        var data = this.durationTextParser(str);
        if (!Object.values(data).every(isNaN)) {
            duration = (data[h.UNITS.second] || 0) + (data[h.UNITS.minute] || 0) * h.RATIOS[h.UNITS.minute] + (data[h.UNITS.hour] || 0) * h.RATIOS[h.UNITS.hour] + (data[h.UNITS.day] || 0) * h.RATIOS[h.UNITS.day];
            if (this.locale === h.LOCALES.sbst)
                duration += (data[h.UNITS.month] || 0) * h.RATIOS[h.UNITS.month] + (data[h.UNITS.year] || 0) * h.RATIOS[h.UNITS.year]; // month/year support for SBST
            else
                duration *= h.RATIOS.magic; // Force duration value in SkyBlock seconds
        } else {
            // Add individual values passed to function
            duration = (seconds || 0) + (minutes || 0) * h.RATIOS[h.UNITS.minute] + (hours || 0) * h.RATIOS[h.UNITS.hour] + (days || 0) * h.RATIOS[h.UNITS.day];
            if (this.locale === h.LOCALES.sbst)
                duration += (months || 0) * h.RATIOS[h.UNITS.month] + (years || 0) * h.RATIOS[h.UNITS.year]; // month/year support for SBST
            else
                duration *= h.RATIOS.magic; // Force duration value in SkyBlock seconds
        }
    }
    this.duration = Math.floor(duration);
    // SKYBLOCK Duration Calculations
    this.sbstSeconds = this.duration % h.RATIOS[h.UNITS.minute];
    this.sbstMinutes = Math.floor(this.duration % h.RATIOS[h.UNITS.hour] / h.RATIOS[h.UNITS.minute]);
    this.sbstHours = Math.floor(this.duration % h.RATIOS[h.UNITS.day] / h.RATIOS[h.UNITS.hour]);
    this.sbstDays = Math.floor(this.duration % h.RATIOS[h.UNITS.month] / h.RATIOS[h.UNITS.day]);
    this.sbstMonths = Math.floor(this.duration % h.RATIOS[h.UNITS.year] / h.RATIOS[h.UNITS.month]);
    this.sbstYears = Math.floor(this.duration / h.RATIOS[h.UNITS.year]);
    // UTC Duration Calculations
    this.utc72thSecs = this.duration % h.RATIOS.magic;
    var totalUtcSecs = Math.floor(this.duration / h.RATIOS.magic);
    this.utcSeconds = totalUtcSecs % h.RATIOS[h.UNITS.minute];
    this.utcMinutes = Math.floor(totalUtcSecs % h.RATIOS[h.UNITS.hour] / h.RATIOS[h.UNITS.minute]);
    this.utcHours = Math.floor(totalUtcSecs % h.RATIOS[h.UNITS.day] / h.RATIOS[h.UNITS.hour]);
    this.utcDays = Math.floor(totalUtcSecs / h.RATIOS[h.UNITS.day]);
    // Representations
    // Computing Representation [years, months, days, hours, minutes, seconds]
    this.computing = {};
    this.computing.SBST = [this.sbstYears, this.sbstMonths, this.sbstDays, this.sbstHours, this.sbstMinutes, this.sbstSeconds];
    // Time Strings
    this.utcString = h.fmtFullDuration(0, 0, this.utcDays, this.utcHours, this.utcMinutes, this.utcSeconds, this.utc72thSecs);
    this.sbstString = h.fmtFullDuration(this.sbstYears, this.sbstMonths, this.sbstDays, this.sbstHours, this.sbstMinutes, this.sbstSeconds);
    return this;
}
SkyDuration.prototype.toString = function() {
    return this.utcString + " (in UTC Duration), " + this.sbstString + " (in SBST Duration)";
}
SkyDuration.prototype.valueOf = function() {
    return this.duration;
}
SkyDuration.prototype.addUTCTime = function(unit, value) {
    if (unit >= h.UNITS.day && unit <= h.UNITS.second)
        this.addSBSTTime(h.UNITS.second, h.checkNumber(value) * h.RATIOS[unit] * h.RATIOS.magic);
    return this;
}
SkyDuration.prototype.addSBSTTime = function(unit, value) {
    if (unit >= h.UNITS.year && unit <= h.UNITS.second)
        this.setDuration(h.LOCALES.sbst, this.valueOf() + h.checkNumber(value));
    return this;
}
SkyDuration.prototype.durationTextParser = function(str) {
    var match;
    return [
        (match = str.match(/(?:\s|^)(\d+)y(?:\s|$)/i)) ? Number(match[1]) : undefined,
        (match = str.match(/(?:\s|^)(\d+)mo(?:\s|$)/i)) ? Number(match[1]) : undefined,
        (match = str.match(/(?:\s|^)(\d+)d(?:\s|$)/i)) ? Number(match[1]) : undefined,
        (match = str.match(/(?:\s|^)(\d+)h(?:\s|$)/i)) ? Number(match[1]) : undefined,
        (match = str.match(/(?:\s|^)(\d+)m(?:\s|$)/i)) ? Number(match[1]) : undefined,
        (match = str.match(/(?:\s|^)(\d+)s(?:\s|$)/i)) ? Number(match[1]) : undefined,
    ]
}
/**
 * Pushed static members from previous editions into prototype
 * in favour of customizability using inheritance.
 **/
