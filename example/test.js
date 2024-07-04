////////////////////////////////////
// Client Test Program
// The examples use Main Server time.
// Usage for Alpha Network time is the same, except you have to swap out SkyDate and SkyRoutine with
// SkyDateAlpha and SkyRoutineAlpha from `SkyAlpha.js`
////////////////////////////////////
import {SkyRoutine} from "../src/SkyRoutine.js";
import {SkyDate} from "../src/SkyDate.js";
import {h} from "../src/SBTEHelpers.js";

function ImplementClock() {
    ////////////////////////////////////
    // 1. Example Implementation of SkyBlock Clock
    ////////////////////////////////////
    // Define element classes to lookup
    var CLOCK_FIELDS = {
        h24: ".hour24",
        h12: ".hour12",
        sec: ".second",
        min: ".minute",
        minActual: ".minute-actual",
        ampm: ".ampm",
        day: ".day",
        dayOrd: ".day-ordinal",
        season: ".season",
        seasonShort: ".season-short",
        month: ".month",
        year: ".year"
    };
    var updateFields = function (skydate, myFields) {
        //////////////////////////////
        // SkyBlock Time
        //////////////////////////////
        myFields.sec.text(skydate.sbstSecond.toString().padStart(2, "0"));
        myFields.h24.text(skydate.sbstHour.toString().padStart(2, "0"));
        myFields.h12.text((skydate.sbstHour % 12 === 0 ? 12 : skydate.sbstHour % 12).toString().padStart(2, "0"));
        // minute shown in-game is rounded down to 10th place:
        myFields.min.text((Math.floor(skydate.sbstMinute / 10) * 10).toString().padStart(2, "0"));
        // actual minute:
        myFields.minActual.text(skydate.sbstMinute.toString().padStart(2, "0"));
        myFields.ampm.text(h.FMTMSG.AMPM[skydate.sbstHour < 12 ? 0 : 1].toLowerCase());
        //////////////////////////////
        // SkyBlock Date
        //////////////////////////////
        myFields.day.text(skydate.sbstDate);
        myFields.dayOrd.text(skydate.sbstOrdinalDate);
        myFields.season.text(skydate.sbstFullMonth);
        myFields.seasonShort.text(skydate.sbstShortMonth);
        myFields.month.text(skydate.sbstMonth + 1);
        myFields.year.text(skydate.sbstFullYear);
    };
    if ($(".sbte-clock").length > 0) {
        // Instantiate objects
        var fields = {},
            currentSkyDate;
        // Record all fields
        Object.keys(CLOCK_FIELDS).forEach(function (key) {
            fields[key] = $(".sbte-clock " + CLOCK_FIELDS[key]);
        });
        // Setup Update function
        currentSkyDate = new SkyDate();
        updateFields(currentSkyDate, fields); // Update once
        // Then, update every SBST Minute: Math.floor(new SkyDuration("1m -S").valueOf() / RATIOS.magic * 1000)
        setInterval(function () {
            updateFields(currentSkyDate.setTime(), fields);
        }, 833);
    }
}
function ImplementDateDisplay() {
    ////////////////////////////////////
    // 2. Example Implementation of SkyBlock Date Display
    ////////////////////////////////////
    var timestampEl = $(".sbte-timestamp:not(.sbte-timestamp .sbte-timestamp)");
    timestampEl.each(function () {
        var elem = $(this);
        var skyDate = new SkyDate(elem.data("skydate"));
        elem.find(".utc").text(skyDate.date.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            timezone: "UTC"
        }));
        elem.find(".local").text(skyDate.date.toLocaleString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "numeric"
        }));
        elem.find(".sbst").text(skyDate.sbstString);
    });
}
function ImplementCountdown() {
    ////////////////////////////////////
    // 3. Example Implementation of Countdown
    ////////////////////////////////////
    var countdownEl = $(".sbte-routine:not(.sbte-routine .sbte-routine)");
    countdownEl.each(function () {
        var elem = $(this);
        var routineInput = elem.data("routine");
        if (!routineInput) {
            // Routine element does not have data-routine definition
            return;
        }
        // Define fields for this element
        var fields = {
            cdName: elem.find(".cd-name"),
            cdLocal: elem.find(".cd-local"),
            cdUtc: elem.find(".cd-utc"),
            cdSbst: elem.find(".cd-sbst"),
            cdTimer: elem.find(".cd-timer"),
            routine: new SkyRoutine(routineInput)
        };
        //////////////////////////////
        // Define countdown actions
        //////////////////////////////
        // Countdown Function used by Waiting and Ongoing state
        var countDownFn = function (stopCountdown, seconds, countToDate, countFromDate, state) {
            if (seconds <= 0)
                return;
            var s = seconds % 60;
            var m = Math.floor(seconds % h.RATIOS[h.UNITS.hour] / h.RATIOS[h.UNITS.minute]);
            var hrs = Math.floor(seconds % h.RATIOS[h.UNITS.day] / h.RATIOS[h.UNITS.hour]);
            var d = Math.floor(seconds / h.RATIOS[h.UNITS.day]);
            // Display counting-down-to date
            fields.cdUtc.text(countToDate.date.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                timezone: "UTC"
            }));
            fields.cdLocal.text(countToDate.date.toLocaleString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric"
            }));
            fields.cdSbst.text(countToDate.toString());
            // Display a time string for the remaining duration
            var timestring = (d > 1 ? (d + " days") : (d + " day")) + " " + h.fmtTime(hrs, m, s);
            if (state === h.STATES.WAITING) {
                // Current state is "waiting"
                fields.cdName.text("Event starts");
                fields.cdTimer.removeClass("ongoing stopped").addClass("waiting");
                fields.cdTimer.text(timestring);
            } else {
                // Current state is "ongoing"
                fields.cdName.text("Event ends");
                fields.cdTimer.removeClass("waiting stopped").addClass("ongoing");
                fields.cdTimer.text("ACTIVE: " + timestring);
            }
        };
        // Define actions for the waiting state
        fields.routine.addEvent(h.STATES.WAITING, function () {
            fields.routine.startCountdown(countDownFn);
        });
        // Define actions for the ongoing state
        fields.routine.addEvent(h.STATES.ONGOING, function () {
            fields.routine.startCountdown(countDownFn);
        });
        // Define actions for the stopped state
        fields.routine.addEvent(h.STATES.STOPPED, function () {
            fields.cdName.text("Event starts");
            fields.cdUtc.text("---");
            fields.cdLocal.text("---");
            fields.cdSbst.text("---");
            fields.cdTimer.removeClass("waiting ongoing").addClass("stopped");
            fields.cdTimer.text("ENDED");
        });
        fields.routine.trigger();
    });

}
$(ImplementClock);
$(ImplementDateDisplay);
$(ImplementCountdown);