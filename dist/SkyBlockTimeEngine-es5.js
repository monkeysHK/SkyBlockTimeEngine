/**
 * @name SkyBlockTimeEngine
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version 3.0
 */

/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/SBTEHelpers.js
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
    formatTime: "$1:$2:$3 $4",
    // placement: [H, M, S, S_72TH]
    formatFullDuration: "$1 $2 $3 $4",
    // placement: [Y, MO, D, TIME]
    formatSBSTDate: "$4 $2 Y$1",
    // placement: [full year, full month, date number, ordinal date]
    formatSBSTTime: "$1:$2 $3",
    // placement: [hour, minute, am/pm]
    formatSBSTFullDate: "$1, $2",
    // placement: [date string, time string]
    AMPM: ["AM", "PM"],
    SHORTMONTHS_UTC: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    SHORTMONTHS_SBST: ["ESP", "SP", "LSP", "ESU", "SU", "LSU", "EAU", "AU", "LAU", "EWI", "WI", "LWI"],
    FULLMONTHS_UTC: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    FULLMONTHS_SBST: ["Early Spring", "Spring", "Late Spring", "Early Summer", "Summer", "Late Summer", "Early Autumn", "Autumn", "Late Autumn", "Early Winter", "Winter", "Late Winter"]
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
    5: 1,
    // one second
    4: 60,
    // minute-to-second ratio
    3: 3600,
    // hour-to-second ratio
    2: 86400,
    // day-to-second ratio
    1: 2678400,
    // month-to-second (=31 days) ratio
    0: 32140800 // year-to-second (=372 days) ratio
  },
  MAGIC_RATIO: 72,
  DATE_FUNC_MAP: ["FullYear", "Month", "Date", "Hours", "Minutes", "Seconds"],
  UNIT_LIMITS: [
  // note: VALUE in [LOWER, UPPER)
  {
    LOWER: 0,
    UPPER: undefined
  }, {
    LOWER: 0,
    UPPER: 12
  }, {
    LOWER: 1,
    UPPER: 32
  }, {
    LOWER: 0,
    UPPER: 24
  }, {
    LOWER: 0,
    UPPER: 60
  }, {
    LOWER: 0,
    UPPER: 60
  }],
  STATES: {
    WAITING: 0,
    ONGOING: 1,
    STOPPED: 2
  },
  checkNumber: function checkNumber(n) {
    if (isNaN(n)) throw new TypeError("Input must be a number");
    return Number(n);
  },
  checkLocale: function checkLocale(str) {
    if (typeof str === "string" && (str === h.LOCALES.utc || h.LOCALES.utc_regex.test(str))) return h.LOCALES.utc;else if (typeof str === "string" && (str === h.LOCALES.sbst || h.LOCALES.sbst_regex.test(str))) return h.LOCALES.sbst;
    return false;
  },
  getMsg: function getMsg( /* ...arguments */
  ) {
    var m = h.FMTMSG[arguments[0]];
    if (!m) return "<msg." + arguments[0] + ">";
    for (var i = 1; i < arguments.length; i++) m = m.replaceAll("$" + i, arguments[i]);
    return m;
  },
  fmtTime: function fmtTime(hrs, m, s, s_72th) {
    return h.getMsg("formatTime", String(hrs).padStart(2, 0), String(m).padStart(2, 0), String(s).padStart(2, 0), s_72th ? h.getMsg("format72th", s_72th) : "").trim();
  },
  fmtFullDuration: function fmtFullDuration(y, mo, d, hrs, m, s, s_72th) {
    return h.getMsg("formatFullDuration", y !== 0 ? h.getMsg("formatYears", y) : "", mo !== 0 ? h.getMsg("formatMonths", mo) : "", d !== 0 ? h.getMsg("formatDays", d) : "", h.fmtTime(hrs, m, s, s_72th)).replaceAll(/\s{2,}/g, " ").trim();
  },
  toOrdinal: function toOrdinal(num) {
    return num + (num >= 11 && num <= 13 ? "th" : num % 10 === 1 ? "st" : num % 10 === 2 ? "nd" : num % 10 === 3 ? "rd" : "th");
  },
  getFirstNumber: function getFirstNumber( /* ...arguments */
  ) {
    for (var i in arguments) {
      if (!isNaN(arguments[i])) return Number(arguments[i]);
    }
  }
};
h.SKYBLOCK_EPOCH = {
  UNIX_TS_UTC: 1560275700,
  UNIX_TS_SBST: 1560275700 * h.RATIOS.magic,
  SKYBLOCK_TS_UTC: 0,
  SKYBLOCK_TS_SBST: 0
};
h.ALPHA_SKYBLOCK_EPOCH = h.SKYBLOCK_EPOCH;

// h.ALPHA_SKYBLOCK_EPOCH = {
//     UNIX_TS_UTC: 1560275700 - 211680,
//     UNIX_TS_SBST: (1560275700 - 211680) * h.RATIOS.magic,
//     SKYBLOCK_TS_UTC: 0,
//     SKYBLOCK_TS_SBST: 0,
// };

/* Exports */

;// CONCATENATED MODULE: ./src/SkyDuration.js
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }


/**
 * **SkyDuration**
 * This script translates between SkyBlock Durations and UTC Durations,
 * and allows arithmetic to be performed on them.
 */
var SkyDuration = /*#__PURE__*/function () {
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
  var _proto = SkyDuration.prototype;
  _proto.setDuration = function setDuration(locale, seconds, minutes, hours, days, months, years) {
    // Determine Duration in SBST Seconds
    var str = ["string", "number"].includes(_typeof(locale)) && String(locale) || "";
    var duration = 0;
    if (!isNaN(str)) {
      // If passed in a number, treat it as UTC seconds
      this.locale = h.LOCALES.utc;
      duration = Number(str) * h.MAGIC_RATIO;
    } else {
      // Else, parse time string
      this.locale = h.checkLocale(str) || h.LOCALES.sbst;
      var data = this.durationTextParser(str);
      if (!Object.values(data).every(isNaN)) {
        duration = (data[h.UNITS.second] || 0) + (data[h.UNITS.minute] || 0) * h.RATIOS[h.UNITS.minute] + (data[h.UNITS.hour] || 0) * h.RATIOS[h.UNITS.hour] + (data[h.UNITS.day] || 0) * h.RATIOS[h.UNITS.day];
        if (this.locale === h.LOCALES.sbst) duration += (data[h.UNITS.month] || 0) * h.RATIOS[h.UNITS.month] + (data[h.UNITS.year] || 0) * h.RATIOS[h.UNITS.year];
        // month/year support for SBST
        else duration *= h.MAGIC_RATIO; // Force duration value in SBST seconds
      } else {
        // Add individual values passed to function
        duration = (seconds || 0) + (minutes || 0) * h.RATIOS[h.UNITS.minute] + (hours || 0) * h.RATIOS[h.UNITS.hour] + (days || 0) * h.RATIOS[h.UNITS.day];
        if (this.locale === h.LOCALES.sbst) duration += (months || 0) * h.RATIOS[h.UNITS.month] + (years || 0) * h.RATIOS[h.UNITS.year]; // month/year support for SBST
        else duration *= h.MAGIC_RATIO; // Force duration value in SBST seconds
      }
    }
    this.duration = Math.floor(duration);
    // SBST Duration Calculations
    this.sbstSeconds = this.duration % h.RATIOS[h.UNITS.minute];
    this.sbstMinutes = Math.floor(this.duration % h.RATIOS[h.UNITS.hour] / h.RATIOS[h.UNITS.minute]);
    this.sbstHours = Math.floor(this.duration % h.RATIOS[h.UNITS.day] / h.RATIOS[h.UNITS.hour]);
    this.sbstDays = Math.floor(this.duration % h.RATIOS[h.UNITS.month] / h.RATIOS[h.UNITS.day]);
    this.sbstMonths = Math.floor(this.duration % h.RATIOS[h.UNITS.year] / h.RATIOS[h.UNITS.month]);
    this.sbstYears = Math.floor(this.duration / h.RATIOS[h.UNITS.year]);
    // UTC Duration Calculations
    this.utc72thSecs = this.duration % h.MAGIC_RATIO;
    var totalUtcSecs = Math.floor(this.duration / h.MAGIC_RATIO);
    this.utcSeconds = totalUtcSecs % h.RATIOS[h.UNITS.minute];
    this.utcMinutes = Math.floor(totalUtcSecs % h.RATIOS[h.UNITS.hour] / h.RATIOS[h.UNITS.minute]);
    this.utcHours = Math.floor(totalUtcSecs % h.RATIOS[h.UNITS.day] / h.RATIOS[h.UNITS.hour]);
    this.utcDays = Math.floor(totalUtcSecs / h.RATIOS[h.UNITS.day]);
    // Representations
    // Computing Representation [years, months, days, hours, minutes, seconds]
    this.computing = {
      SBST: [this.sbstYears, this.sbstMonths, this.sbstDays, this.sbstHours, this.sbstMinutes, this.sbstSeconds],
      UTC: [null, null, this.utcDays, this.utcHours, this.utcMinutes, this.utcSeconds, this.utc72thSecs]
    };
    // Time Strings
    this.utcString = h.fmtFullDuration(0, 0, this.utcDays, this.utcHours, this.utcMinutes, this.utcSeconds, this.utc72thSecs);
    this.sbstString = h.fmtFullDuration(this.sbstYears, this.sbstMonths, this.sbstDays, this.sbstHours, this.sbstMinutes, this.sbstSeconds);
    return this;
  };
  _proto.toString = function toString() {
    return this.utcString + " (in UTC Duration), " + this.sbstString + " (in SBST Duration)";
  };
  _proto.valueOf = function valueOf() {
    return this.duration;
  };
  _proto.addUTCTime = function addUTCTime(unit, value) {
    if (unit >= h.UNITS.day && unit <= h.UNITS.second) this.addSBSTTime(h.UNITS.second, h.checkNumber(value) * h.RATIOS[unit] * h.MAGIC_RATIO);
    return this;
  };
  _proto.addSBSTTime = function addSBSTTime(unit, value) {
    if (unit >= h.UNITS.year && unit <= h.UNITS.second) this.setDuration(h.LOCALES.sbst, this.valueOf() + h.checkNumber(value));
    return this;
  };
  _proto.durationTextParser = function durationTextParser(str) {
    var match;
    return [(match = str.match(/(?:\s|^)(\d+)y(?:\s|$)/i)) ? Number(match[1]) : undefined, (match = str.match(/(?:\s|^)(\d+)mo(?:\s|$)/i)) ? Number(match[1]) : undefined, (match = str.match(/(?:\s|^)(\d+)d(?:\s|$)/i)) ? Number(match[1]) : undefined, (match = str.match(/(?:\s|^)(\d+)h(?:\s|$)/i)) ? Number(match[1]) : undefined, (match = str.match(/(?:\s|^)(\d+)m(?:\s|$)/i)) ? Number(match[1]) : undefined, (match = str.match(/(?:\s|^)(\d+)s(?:\s|$)/i)) ? Number(match[1]) : undefined];
  };
  return _createClass(SkyDuration);
}();
/**
 * Pushed static members from previous editions into prototype
 * in favour of customizability using inheritance.
 **/
/* Exports */

;// CONCATENATED MODULE: ./src/SkyDate.js
function SkyDate_typeof(o) { "@babel/helpers - typeof"; return SkyDate_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, SkyDate_typeof(o); }
function SkyDate_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, SkyDate_toPropertyKey(o.key), o); } }
function SkyDate_createClass(e, r, t) { return r && SkyDate_defineProperties(e.prototype, r), t && SkyDate_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function SkyDate_toPropertyKey(t) { var i = SkyDate_toPrimitive(t, "string"); return "symbol" == SkyDate_typeof(i) ? i : i + ""; }
function SkyDate_toPrimitive(t, r) { if ("object" != SkyDate_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != SkyDate_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }



/**
 * **SkyDate**
 * This script translates between SkyBlock Std Time (SBST) and Coordinated Universal Time (UTC).
 * Also supports output for Local Time (LOCAL).
 * The main structure is from JavaScript Date.
 * The time value is stored as a SkyDuration, which operates on SkyBlock seconds. The value is an offset from the SkyBlock Epoch (UNIX_EPOCH_SBST).
 * Dependencies: SkyDuration
 * Note: Users are not supposed to modify the values of this.duration and this.date directly. Only use them to read values.
 */
var SkyDate = /*#__PURE__*/function () {
  function SkyDate(locale, year, monthIndex, day, hours, minutes, seconds) {
    this.EPOCH = h.SKYBLOCK_EPOCH;
    /* Data */
    this.INPUTMONTHS_UTC = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    this.INPUTMONTHS_SBST = ["ESP", "SP", "LSP", "ESU", "SU", "LSU", "EAU", "AU", "LAU", "EWI", "WI", "LWI"];
    this.SHORTMONTHS_UTC = h.FMTMSG.SHORTMONTHS_UTC;
    this.SHORTMONTHS_SBST = h.FMTMSG.SHORTMONTHS_SBST;
    this.FULLMONTHS_UTC = h.FMTMSG.FULLMONTHS_UTC;
    this.FULLMONTHS_SBST = h.FMTMSG.FULLMONTHS_SBST;
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
   * `Locale` should be h.LOCALES.utc or h.LOCALES.sbst.
   * In the 2nd/3rd case: Specifications for all units are optional, but at least one must be present.
   * The largest specified unit is called the Most Significant Unit (MSU):
   *       > If a unit higher than the MSU is not specified, it will take its value in the current time.
   *       > If a unit lower than the MSU is not specified, it will take its lowest possible value.
   */
  var _proto = SkyDate.prototype;
  _proto.setTime = function setTime(locale, year, monthIndex, day, hours, minutes, seconds) {
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
      var str = ["string", "number"].includes(SkyDate_typeof(locale)) ? String(locale) : "";
      this.locale = h.checkLocale(str) || h.LOCALES.sbst;
      var meme = [year, monthIndex, day, hours, minutes, seconds];
      var data = this.dateTextParser(str);
      var current = this.currentTime();
      var most_significant, i;
      for (i = 0; i < 6; i++) {
        if (isNaN(most_significant)) {
          if (!(isNaN(meme[i]) && isNaN(data[i]))) most_significant = i; // on most significant
          meme[i] = h.getFirstNumber(meme[i], data[i], current[this.locale][i]); // before/on most significant: default current
        } else {
          meme[i] = h.getFirstNumber(meme[i], data[i], h.UNIT_LIMITS[i].LOWER); // after most significant: default lowest
        }
      }
      if (this.locale === h.LOCALES.utc) {
        var ts = Date.UTC(meme[h.UNITS.year], meme[h.UNITS.month], meme[h.UNITS.day], meme[h.UNITS.hour], meme[h.UNITS.minute], meme[h.UNITS.second]) / 1000;
        this.duration = this.durationFromUTCUnixTime(ts);
      } else {
        this.duration = new SkyDuration(h.LOCALES.sbst, meme[h.UNITS.second] || 0,
        // 0-60
        meme[h.UNITS.minute] || 0,
        // 0-60
        meme[h.UNITS.hour] || 0,
        // 0-60
        meme[h.UNITS.day] - 1,
        // 1-31
        meme[h.UNITS.month],
        // 0-11
        meme[h.UNITS.year] - 1); // 1-inf
      }
      /*
      // if using non-exact date expression, and date already passed, shift to next occurence
      if ((most_significant || 0) > 0 && (this.duration.valueOf() + this.EPOCH.UNIX_TS_SBST) < (Date.now() / 1000 * h.MAGIC_RATIO)) {
          if (this.locale === h.LOCALES.utc) {
              let tempdate = getDateFromDuration(this.duration);
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
    var hour12 = this.sbstHour % 12 === 0 ? 12 : this.sbstHour % 12;
    this.sbstTimeString = h.getMsg("formatSBSTTime", hour12.toString().padStart(2, "0"), this.sbstMinute.toString().padStart(2, "0"), h.FMTMSG.AMPM[this.sbstHour < 12 ? 0 : 1]);
    // ref: Date.__proto__.toString
    this.sbstString = h.getMsg("formatSBSTFullDate", this.sbstDateString, this.sbstTimeString);
    // Timestamps
    this.SKYBLOCK_TS_SBST = this.duration.valueOf(); // The SKYBLOCK timestamp (seconds from SkyBlock Epoch) to this instance using SBST units
    this.SKYBLOCK_TS_UTC = Math.floor(this.duration.valueOf() / h.MAGIC_RATIO); // The SKYBLOCK timestamp (seconds from SkyBlock Epoch) to this instance using UTC units
    this.UNIX_TS_SBST = this.EPOCH.UNIX_TS_SBST + this.SKYBLOCK_TS_SBST; // The UNIX Timestamp (seconds from Unix Epoch) to this instance using SBST units
    this.UNIX_TS_UTC = this.EPOCH.UNIX_TS_UTC + this.SKYBLOCK_TS_UTC; // The UNIX Timestamp (seconds from Unix Epoch) to this instance using UTC units
    return this; // note: this.valueOf() == SKYBLOCK_TS_SBST
  }

  /* Setters */;
  _proto.setSBSTTimestamp = function setSBSTTimestamp(ts) {
    // ts in SBST seconds (not ms)!
    return this.setTime(new SkyDuration(h.LOCALES.sbst, ts));
  };
  _proto.setUTCTimestamp = function setUTCTimestamp(ts) {
    // ts in UTC seconds (not ms)!
    return this.setTime(this.durationFromUTCUnixTime(ts));
  };
  _proto.addDuration = function addDuration(sbstSeconds) {
    this.duration.addSBSTTime(h.UNITS.second, sbstSeconds);
    return this.setTime(this.duration);
  };
  _proto.setSBSTTime = function setSBSTTime(unit, value) {
    if (unit >= h.UNITS.year && unit <= h.UNITS.second) this.duration.addSBSTTime(unit, h.checkNumber(value) - this.computing.SBST[unit]);
    return this.setTime(this.duration);
  };
  _proto.setLocalTime = function setLocalTime(unit, value) {
    if (unit >= h.UNITS.year && unit <= h.UNITS.second) this.date["set" + h.DATE_FUNC_MAP[unit]](h.checkNumber(value));
    return this.setUTCTimestamp(this.date.valueOf() / 1000);
  };
  _proto.setUTCTime = function setUTCTime(unit, value) {
    if (unit >= h.UNITS.year && unit <= h.UNITS.second) this.date["setUTC" + h.DATE_FUNC_MAP[unit]](h.checkNumber(value));
    return this.setUTCTimestamp(this.date.valueOf() / 1000);
  }
  /* Tip: Use this.date to get UTC/LOCAL Time information with the JS Date */;
  _proto.valueOf = function valueOf() {
    return this.SKYBLOCK_TS_SBST; // Return the SKYBLOCK timestamp (seconds from SkyBlock Epoch) of this instance using SBST units
  };
  _proto.toString = function toString() {
    return this.sbstString;
  }

  /* Helpers */;
  _proto.currentTime = function currentTime() {
    var currentDate = new Date();
    var currentDuration = new SkyDuration(h.LOCALES.utc, Date.now() / 1000 - this.EPOCH.UNIX_TS_UTC).computing.SBST;
    var result = {};
    result[h.LOCALES.utc] = [currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate(), currentDate.getUTCHours(), currentDate.getUTCMinutes(), currentDate.getUTCSeconds()];
    result[h.LOCALES.sbst] = [currentDuration[0] + 1, currentDuration[1], currentDuration[2] + 1, currentDuration[3], currentDuration[4], currentDuration[5]];
    return result;
  };
  _proto.durationFromUTCUnixTime = function durationFromUTCUnixTime(ts) {
    return new SkyDuration(h.LOCALES.utc, ts - this.EPOCH.UNIX_TS_UTC);
  };
  _proto.dateFromDuration = function dateFromDuration(duration) {
    return new Date((duration.valueOf() / h.MAGIC_RATIO + this.EPOCH.UNIX_TS_UTC) * 1000);
  };
  _proto.matchMonth = function matchMonth(str) {
    for (var i = 0; i < 12; i++) {
      if (new RegExp("\\b" + this.INPUTMONTHS_UTC[i] + "\\b", "gi").test(str) || new RegExp("\\b" + this.INPUTMONTHS_SBST[i] + "\\b", "gi").test(str)) return i;
    }
  };
  _proto.dateTextParser = function dateTextParser(str) {
    var match;
    return [(match = str.match(/(?:\s|^)Y(\d+)(?:\s|$)/i)) ? Number(match[1]) : undefined, (match = str.match(/(?:\s|^)M(\d+)(?:\s|$)/i)) ? Number(match[1]) - 1 : (match = str.match(/\b([A-Za-z]{2,})\b/i)) ? this.matchMonth(match[1]) : undefined, (match = str.match(/(?:\s|^)D(\d+)(?:\s|$)/i)) ? Number(match[1]) : undefined, (match = str.match(/(?:\s|^)(\d+):/)) ? Number(match[1]) : undefined, (match = str.match(/(?:\s|^)\d*:(\d+)/)) ? Number(match[1]) : undefined, (match = str.match(/(?:\s|^)\d*:\d*:(\d+)/)) ? Number(match[1]) : undefined];
  };
  return SkyDate_createClass(SkyDate);
}();
/**
 * Pushed static members from previous editions into prototype
 * in favour of customizability using inheritance.
 **/
/* Exports */

;// CONCATENATED MODULE: ./src/SkyRoutine.js
function SkyRoutine_typeof(o) { "@babel/helpers - typeof"; return SkyRoutine_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, SkyRoutine_typeof(o); }
function SkyRoutine_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, SkyRoutine_toPropertyKey(o.key), o); } }
function SkyRoutine_createClass(e, r, t) { return r && SkyRoutine_defineProperties(e.prototype, r), t && SkyRoutine_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function SkyRoutine_toPropertyKey(t) { var i = SkyRoutine_toPrimitive(t, "string"); return "symbol" == SkyRoutine_typeof(i) ? i : i + ""; }
function SkyRoutine_toPrimitive(t, r) { if ("object" != SkyRoutine_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != SkyRoutine_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }




/**
 * **SkyRoutine**
 * A routine handler for both SkyBlock Time and UTC Time.
 * Dependencies: SkyDuration, SkyDate
 */
var SkyRoutine = /*#__PURE__*/function () {
  function SkyRoutine(str) {
    this.tasksId = -1;
    this.tasks = []; // array of { event: <any STATES>, cb: function }
    this.taskStack = [];
    this.definition = str;
  }
  /*** MEMBER FUNCTIONS ***/
  var _proto = SkyRoutine.prototype;
  _proto.trigger = function trigger(str) {
    this.definition = str || this.definition;
    var data = this.routineTextParser(this.definition);
    // Calculations
    var chosenLocale = h.checkLocale(data.anchor) || h.LOCALES.sbst;
    var i;
    this.anchor = new this.SkyDateConstructor(data.anchor); // a SkyDate used as number
    this.totalduration = this.totalbreak = this.cycleExecutions = this.routineExecutions = 0;
    this.currentEventTime = this.nextEventTime = undefined;
    this.routinePtr = -1;
    // Handle Cycle
    this.cycle = (data.cycle || "0/0").split("/");
    if (this.cycle.length % 2 === 1) this.cycle.push(0);
    for (i = 0; i < this.cycle.length; i++) {
      var v = this.cycle[i].toString().trim();
      this.cycle[i] = v !== "" && !isNaN(v) ? new SkyDuration(chosenLocale, v) : new SkyDuration(v || 0); // a SkyDuration used as number
      this.totalduration += i % 2 === 0 ? this.cycle[i].valueOf() : 0;
      this.totalbreak += i % 2 === 1 ? this.cycle[i].valueOf() : 0;
    }
    this.cycleTime = this.totalduration + this.totalbreak;
    this.executeOnce = this.cycleTime < 1;
    // Handle Limits
    if (this.executeOnce) this.limit = 1; /* no cycle length: force limit of 1 */
    if (!isNaN(data.limit)) {
      this.limit = Number(data.limit);
      this.cycleLimit = Math.floor(this.limit / (this.cycle.length / 2));
    }
    if (!!data.until) this.until = new this.SkyDateConstructor(data.until); // a SkyDate used as number

    // Get Initial State
    var currentDate = new this.SkyDateConstructor();
    if (currentDate < this.anchor) {
      // cond. 1: not started; cycleExecutions and routineExecutions remains 0
      this.currentState = h.STATES.WAITING;
      this.nextEventTime = this.anchor;
    } else {
      // seek lastCycleStart, lastRoutineStart, cycleExecutions, routineExecutions
      var lastCycleStart, lastRoutineStart;
      if (this.executeOnce) {
        this.cycleExecutions = 1;
        lastRoutineStart = lastCycleStart = this.anchor;
      } else {
        this.cycleExecutions = Math.floor(((this.until && this.until < currentDate ? this.until : currentDate) - this.anchor) / this.cycleTime + 1);
        if (this.cycleLimit) this.cycleExecutions = Math.min(this.cycleLimit, this.cycleExecutions);
        lastRoutineStart = lastCycleStart = this.anchor + (this.cycleExecutions - 1) * this.cycleTime;
      }
      var doubleRoutineCount = (this.cycleExecutions - 1) * this.cycle.length;
      var cumulated = 0;
      for (i = 0; i < this.cycle.length; i++) {
        if (lastRoutineStart + (cumulated + this.cycle[i]) > currentDate) {
          // this.routinePtr is only valid (> 0) when a routine will happen across the current date
          this.routinePtr = i;
          doubleRoutineCount += i;
          lastRoutineStart += cumulated;
          break;
        }
        cumulated += this.cycle[i];
      }
      this.routineExecutions = Math.floor(doubleRoutineCount / 2) + 1;
      if (this.limit) this.routineExecutions = Math.min(this.limit, this.routineExecutions);
      if (this.executeOnce ||
      // cond. 2: cycle length 0 and executed once
      this.limit && this.limit >= 0 && this.routineExecutions >= this.limit ||
      // cond. 3: execution limit reached
      this.until && currentDate >= this.until) {
        // cond. 4: date limit reached
        if (this.routinePtr % 2 === 1 || lastRoutineStart + this.getPeriod() < currentDate) {
          // cond: not ongoing
          this.currentState = h.STATES.STOPPED;
        } else {
          this.currentState = h.STATES.ONGOING;
          this.currentEventTime = lastRoutineStart;
          this.nextEventTime = lastRoutineStart + this.getPeriod();
        }
      } else {
        // cond. 5: no limits reached
        this.currentState = this.routinePtr % 2 === 0 ? h.STATES.ONGOING : h.STATES.WAITING;
        this.currentEventTime = lastRoutineStart;
        this.nextEventTime = lastRoutineStart + this.getPeriod();
      }
    }
    // Trigger event
    if (this.currentState === h.STATES.ONGOING) this.onEventStart(true);else this.onEventEnd(true);
  };
  _proto.pause = function pause() {
    for (var i in this.taskStack) clearTimeout(this.taskStack[i]);
    this.taskStack = [];
  };
  _proto.removeTimeout = function removeTimeout(id) {
    this.taskStack.splice(this.taskStack.indexOf(id), 1);
  };
  _proto.addEvent = function addEvent(eventState, callback) {
    if (Object.values(h.STATES).includes(eventState)) {
      this.tasksId++;
      this.tasks[this.tasksId] = {
        event: eventState,
        cb: callback
      };
      if (this.currentState === eventState) callback(this.currentState);
      return this.tasksId;
    }
  };
  _proto.removeEvent = function removeEvent(id) {
    if (id in this.tasks) {
      delete this.tasks[id];
      return true;
    }
    return false;
  };
  _proto.getPeriod = function getPeriod(forward) {
    if (this.routinePtr + (forward || 0) < 0) return 0;
    return this.cycle[(this.routinePtr + (forward || 0)) % this.cycle.length];
  };
  _proto.advancePeriod = function advancePeriod(forward) {
    this.routinePtr = (this.routinePtr + (forward || 0)) % this.cycle.length;
  };
  _proto.onEventStart = function onEventStart(noStateChanges) {
    // State Changes
    if (!noStateChanges) {
      this.advancePeriod(1);
      this.currentEventTime = this.nextEventTime;
      this.nextEventTime += this.getPeriod(0); // Note: Calculation dependent on last state
      this.currentState = h.STATES.ONGOING;
      this.routineExecutions++;
      this.cycleExecutions += this.routinePtr === 0 ? 1 : 0;
    }
    // Call Tasks
    this.callEventSet(h.STATES.ONGOING);
    // Activate Next
    this.passTheBall(this.onEventEnd.bind(this), this.nextEventTime);
    // Schedule future termination if limits reached
    if (this.limit && this.routineExecutions >= this.limit ||
    // reached execution limit
    this.until && this.nextEventTime >= this.until)
      // next start time reached/over date limit
      this.nextEventTime = null;
  };
  _proto.onEventEnd = function onEventEnd(noStateChanges) {
    // Check termination
    if (!this.nextEventTime) {
      // State Changes
      this.currentState = h.STATES.STOPPED;
      this.currentEventTime = undefined;
      // Call Tasks
      this.callEventSet(h.STATES.STOPPED);
      return;
    }
    // State Changes
    if (!noStateChanges) {
      this.advancePeriod(1);
      this.currentEventTime = this.nextEventTime;
      this.nextEventTime += this.getPeriod(0);
      this.currentState = h.STATES.WAITING;
    }
    // Call Tasks
    this.callEventSet(h.STATES.WAITING);
    // Activate Next
    this.passTheBall(this.onEventStart.bind(this), this.nextEventTime);
  };
  _proto.passTheBall = function passTheBall(callback, startSkyDate) {
    var now = new this.SkyDateConstructor();
    var till = Math.floor(Math.max(startSkyDate - now, 0) / h.MAGIC_RATIO * 1000); // convert SBST seconds to UTC milliseconds
    var _this = this;
    // Only schedule tasks within one day
    if (till < 86400000) {
      var tout = setTimeout(function () {
        callback();
        _this.removeTimeout(tout);
      }, till);
      _this.taskStack.push(tout);
    }
  };
  _proto.callEventSet = function callEventSet(eventset) {
    for (var i in this.tasks) if (this.tasks[i].event === eventset) this.tasks[i].cb(this.currentState);
  };
  _proto.startCountdown = function startCountdown(callback) {
    var _this = this;
    // align to system clock
    var countTo = this.nextEventTime / h.MAGIC_RATIO,
      countToDate = new this.SkyDateConstructor(new SkyDuration(h.LOCALES.sbst, this.nextEventTime)),
      countFromDate = new this.SkyDateConstructor(new SkyDuration(h.LOCALES.sbst, this.currentEventTime));
    var stopCountdown = function stopCountdown(id) {
      countdownStackRemove(id);
    };
    var countdownId = countdownStackAdd(function () {
      var now = Date.now() / 1000 - _this.EPOCH.UNIX_TS_UTC;
      var utcSecondsRemain = Math.floor(countTo - now);
      if (utcSecondsRemain <= 0) countdownStackRemove(countdownId);
      callback(stopCountdown.bind(null, countdownId), utcSecondsRemain, countToDate, countFromDate, _this.currentState);
    });
  }
  /* Helpers */;
  _proto.routineTextParser = function routineTextParser(str) {
    var match;
    return {
      cycle: (match = str.match(/(?:\s|^)C\[(.*?)\]/)) ? match[1] : undefined,
      // pipe-separated list of duration expr or number
      limit: (match = str.match(/(?:\s|^)L\[(.*?)\]/)) ? match[1] : undefined,
      // a number
      until: (match = str.match(/(?:\s|^)U\[(.*?)\]/)) ? match[1] : undefined,
      // a date expr
      anchor: (match = str.match(/(?:\s|^)A\[(.*?)\]/)) ? match[1] : undefined // a date expr
    };
  };
  return SkyRoutine_createClass(SkyRoutine);
}();
/* Maintain a Countdown Stack Privately */
/* All derived classes share this stack */
var countdownStackId = -1;
var countdownStack = [];
var countdownStackAdd = function countdownStackAdd(callback) {
  countdownStackId++;
  countdownStack[countdownStackId] = callback;
  return countdownStackId;
};
var countdownStackRemove = function countdownStackRemove(id) {
  if (id in countdownStack) {
    delete countdownStack[id];
    return true;
  }
  return false;
};
var alignTout = setTimeout(function () {
  clearTimeout(alignTout);
  // now start actual countdown
  setInterval(function () {
    for (var i in countdownStack) countdownStack[i]();
  }, 1000);
  // call it the first time
  for (var i in countdownStack) countdownStack[i]();
}, new Date().valueOf() % 1000);
/* Items pushed to prototype for inheritance purposes */
SkyRoutine.prototype.SkyDateConstructor = SkyDate;
SkyRoutine.prototype.EPOCH = h.SKYBLOCK_EPOCH;
/**
 * Pushed static members from previous editions into prototype
 * in favour of customizability using inheritance.
 **/
/* Exports */

;// CONCATENATED MODULE: ./src/AlphaExt.js
function AlphaExt_typeof(o) { "@babel/helpers - typeof"; return AlphaExt_typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, AlphaExt_typeof(o); }
function AlphaExt_defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, AlphaExt_toPropertyKey(o.key), o); } }
function AlphaExt_createClass(e, r, t) { return r && AlphaExt_defineProperties(e.prototype, r), t && AlphaExt_defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function AlphaExt_toPropertyKey(t) { var i = AlphaExt_toPrimitive(t, "string"); return "symbol" == AlphaExt_typeof(i) ? i : i + ""; }
function AlphaExt_toPrimitive(t, r) { if ("object" != AlphaExt_typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != AlphaExt_typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }




/**
 * **SkyAlpha**
 * This script creates children classes with the time is shifted to match the time system on the Alpha Network of present time
 * Classes: SkyDateAlpha, SkyRoutineAlpha
 * Dependencies: SkyDuration, SkyDate, SkyRoutine
 */

/*** SkyDateAlpha ***/
var SkyDateAlpha = /*#__PURE__*/function (_SkyDate) {
  function SkyDateAlpha() {
    var _this;
    SkyDate.apply(_assertThisInitialized(_this), arguments);
    return _assertThisInitialized(_this);
  }
  _inherits(SkyDateAlpha, _SkyDate);
  return AlphaExt_createClass(SkyDateAlpha);
}(SkyDate);
/*** SkyRoutineAlpha ***/
var SkyRoutineAlpha = /*#__PURE__*/AlphaExt_createClass(function SkyRoutineAlpha() {
  this.EPOCH = ALPHA_SKYBLOCK_EPOCH;
  this.SkyDateConstructor = SkyDateAlpha;
  SkyRoutine.apply(this, arguments);
});
/* Exports */

;// CONCATENATED MODULE: ./src/entry.js





(function (window, $, mw) {
  "use strict";

  var wikiname = "hsbwiki";
  window[wikiname] = window[wikiname] || {};
  window[wikiname].sbte = window[wikiname].sbte || {};
  if (window[wikiname].sbte.loaded) {
    return;
  }
  window[wikiname].sbte.loaded = true;

  // Attach to wikiname global
  window[wikiname].sbte = $.extend(window[wikiname].sbte, {
    SkyDuration: SkyDuration,
    SkyDate: SkyDate,
    SkyRoutine: SkyRoutine,
    SkyDateAlpha: SkyDateAlpha,
    SkyRoutineAlpha: SkyRoutineAlpha,
    helpers: h
  });

  // Attach mw.hook: fire event on load
  mw.hook(wikiname + ".sbte").fire(window[wikiname].sbte);
})(window, jQuery, mediaWiki);
/******/ })()
;