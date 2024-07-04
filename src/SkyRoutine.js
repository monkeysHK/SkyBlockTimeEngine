import { SkyDate } from "./SkyDate.js";
import { SkyDuration } from "./SkyDuration.js";
import { h } from "./SBTEHelpers.js";

/**
 * **SkyRoutine**
 * A routine handler for both SkyBlock Time and UTC Time.
 * Dependencies: SkyDuration, SkyDate
 */
class SkyRoutine {
    constructor(str) {
        this.tasksId = -1;
        this.tasks = []; // array of { event: <any STATES>, cb: function }
        this.taskStack = [];
        this.definition = str;
    }
    /*** MEMBER FUNCTIONS ***/
    trigger(str) {
        this.definition = str || this.definition;
        let data = this.routineTextParser(this.definition);
        // Calculations
        let chosenLocale = h.checkLocale(data.anchor) || h.LOCALES.sbst;
        let i;
        this.anchor = new this.SkyDateConstructor(data.anchor); // a SkyDate used as number
        this.totalduration = this.totalbreak = this.cycleExecutions = this.routineExecutions = 0;
        this.currentEventTime = this.nextEventTime = undefined;
        this.routinePtr = -1;
        // Handle Cycle
        this.cycle = (data.cycle || "0/0").split("/");
        if (this.cycle.length % 2 === 1) this.cycle.push(0);
        for (i = 0; i < this.cycle.length; i++) {
            let v = this.cycle[i].toString().trim();
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
        let currentDate = new this.SkyDateConstructor();
        if (currentDate < this.anchor) {
            // cond. 1: not started; cycleExecutions and routineExecutions remains 0
            this.currentState = h.STATES.WAITING;
            this.nextEventTime = this.anchor;
        } else {
            // seek lastCycleStart, lastRoutineStart, cycleExecutions, routineExecutions
            let lastCycleStart, lastRoutineStart;
            if (this.executeOnce) {
                this.cycleExecutions = 1;
                lastRoutineStart = lastCycleStart = this.anchor;
            } else {
                this.cycleExecutions = Math.floor(((this.until && this.until < currentDate ? this.until : currentDate) - this.anchor) / this.cycleTime + 1);
                if (this.cycleLimit) this.cycleExecutions = Math.min(this.cycleLimit, this.cycleExecutions);
                lastRoutineStart = lastCycleStart = this.anchor + (this.cycleExecutions - 1) * this.cycleTime;
            }
            let doubleRoutineCount = (this.cycleExecutions - 1) * this.cycle.length;
            let cumulated = 0;
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

            if (
                this.executeOnce || // cond. 2: cycle length 0 and executed once
                (this.limit && this.limit >= 0 && this.routineExecutions >= this.limit) || // cond. 3: execution limit reached
                (this.until && currentDate >= this.until)
            ) {
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
        if (this.currentState === h.STATES.ONGOING) this.onEventStart(true);
        else this.onEventEnd(true);
    }
    pause() {
        for (let i in this.taskStack) clearTimeout(this.taskStack[i]);
        this.taskStack = [];
    }
    removeTimeout(id) {
        this.taskStack.splice(this.taskStack.indexOf(id), 1);
    }
    addEvent(eventState, callback) {
        if (Object.values(h.STATES).includes(eventState)) {
            this.tasksId++;
            this.tasks[this.tasksId] = {
                event: eventState,
                cb: callback,
            };
            if (this.currentState === eventState) callback(this.currentState);
            return this.tasksId;
        }
    }
    removeEvent(id) {
        if (id in this.tasks) {
            delete this.tasks[id];
            return true;
        }
        return false;
    }
    getPeriod(forward) {
        if (this.routinePtr + (forward || 0) < 0) return 0;
        return this.cycle[(this.routinePtr + (forward || 0)) % this.cycle.length];
    }
    advancePeriod(forward) {
        this.routinePtr = (this.routinePtr + (forward || 0)) % this.cycle.length;
    }
    onEventStart(noStateChanges) {
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
        if (
            (this.limit && this.routineExecutions >= this.limit) || // reached execution limit
            (this.until && this.nextEventTime >= this.until)
        )
            // next start time reached/over date limit
            this.nextEventTime = null;
    }
    onEventEnd(noStateChanges) {
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
    }
    passTheBall(callback, startSkyDate) {
        let now = new this.SkyDateConstructor();
        let till = Math.floor((Math.max(startSkyDate - now, 0) / h.MAGIC_RATIO) * 1000); // convert SBST seconds to UTC milliseconds
        let _this = this;
        // Only schedule tasks within one day
        if (till < 86400000) {
            let tout = setTimeout(function () {
                callback();
                _this.removeTimeout(tout);
            }, till);
            _this.taskStack.push(tout);
        }
    }
    callEventSet(eventset) {
        for (let i in this.tasks) if (this.tasks[i].event === eventset) this.tasks[i].cb(this.currentState);
    }
    startCountdown(callback) {
        let _this = this;
        // align to system clock
        let countTo = this.nextEventTime / h.MAGIC_RATIO,
            countToDate = new this.SkyDateConstructor(new SkyDuration(h.LOCALES.sbst, this.nextEventTime)),
            countFromDate = new this.SkyDateConstructor(new SkyDuration(h.LOCALES.sbst, this.currentEventTime));
        let stopCountdown = function (id) {
            countdownStackRemove(id);
        };
        let countdownId = countdownStackAdd(function () {
            let now = Date.now() / 1000 - _this.EPOCH.UNIX_TS_UTC;
            let utcSecondsRemain = Math.floor(countTo - now);
            if (utcSecondsRemain <= 0) countdownStackRemove(countdownId);
            callback(stopCountdown.bind(null, countdownId), utcSecondsRemain, countToDate, countFromDate, _this.currentState);
        });
    }
    /* Helpers */
    routineTextParser(str) {
        let match;
        return {
            cycle: (match = str.match(/(?:\s|^)C\[(.*?)\]/)) ? match[1] : undefined, // pipe-separated list of duration expr or number
            limit: (match = str.match(/(?:\s|^)L\[(.*?)\]/)) ? match[1] : undefined, // a number
            until: (match = str.match(/(?:\s|^)U\[(.*?)\]/)) ? match[1] : undefined, // a date expr
            anchor: (match = str.match(/(?:\s|^)A\[(.*?)\]/)) ? match[1] : undefined, // a date expr
        };
    }
}
/* Maintain a Countdown Stack Privately */
/* All derived classes share this stack */
let countdownStackId = -1;
let countdownStack = [];
let countdownStackAdd = function (callback) {
    countdownStackId++;
    countdownStack[countdownStackId] = callback;
    return countdownStackId;
};
let countdownStackRemove = function (id) {
    if (id in countdownStack) {
        delete countdownStack[id];
        return true;
    }
    return false;
};
let alignTout = setTimeout(function () {
    clearTimeout(alignTout);
    // now start actual countdown
    setInterval(function () {
        for (let i in countdownStack) countdownStack[i]();
    }, 1000);
    // call it the first time
    for (let i in countdownStack) countdownStack[i]();
}, new Date().valueOf() % 1000);
/* Items pushed to prototype for inheritance purposes */
SkyRoutine.prototype.SkyDateConstructor = SkyDate;
SkyRoutine.prototype.EPOCH = h.SKYBLOCK_EPOCH;
/**
 * Pushed static members from previous editions into prototype
 * in favour of customizability using inheritance.
 **/
/* Exports */
export { SkyRoutine };
