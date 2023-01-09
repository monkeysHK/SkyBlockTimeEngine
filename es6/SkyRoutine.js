/**
 * @name SkyBlockTimeEngine (ES6 Version)
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version beta_2
 */
/**
 * **SkyRoutine**  
 * A routine handler for both SkyBlock Time and UTC Time.  
 * Dependencies: SkyDuration, SkyDate  
 */
class SkyRoutine {
    /* INDEX */
    tasksId = -1
    tasks = [] // array of { event: <any STATES>, cb: function }
    timeoutStack = []
    constructor(str) {
        this.definition = str;
    }
    trigger(str) {
        this.definition = str || this.definition;
        let data = SkyRoutine.routineTextParser(this.definition);
        // Calculations
        let chosenLocale = checkLocale(data.anchor) || LOCALES.sbst;
        let i;
        this.anchor = new SkyDate(data.anchor); // a SkyDate used as number
        this.totalduration = this.totalbreak = this.cycleExecutions = this.routineExecutions = 0;
        this.routinePtr = -1;
        // Handle Cycle
        this.cycle = (data.cycle || "0|0").split("|");
        if (this.cycle.length % 2 === 1)
            this.cycle.push(0);
        for (i = 0; i < this.cycle.length; i++) {
            let v = this.cycle[i].toString().trim();
            this.cycle[i] = v !== "" && !isNaN(v) ? new SkyDuration(chosenLocale, v) : new SkyDuration(v || 0); // a SkyDuration used as number
            this.totalduration += i % 2 === 0 ? this.cycle[i].valueOf() : 0;
            this.totalbreak += i % 2 === 1 ? this.cycle[i].valueOf() : 0;
        }
        this.cycleTime = this.totalduration + this.totalbreak;
        this.executeOnce = this.cycleTime < 1;
        // Handle Limits
        if (this.executeOnce)
            this.limit = 1; /* no cycle length: force limit of 1 */
        if (!isNaN(data.limit)) {
            this.limit = Number(data.limit);
            this.cycleLimit = Math.floor(this.limit / (this.cycle.length / 2));
        }
        if (!!data.until)
            this.until = new SkyDate(data.until); // a SkyDate used as number
        // Get Initial State
        let currentDate = new SkyDate();
        if (currentDate < this.anchor) { // cond. 1: not started; cycleExecutions and routineExecutions remains 0
            this.currentState = SCHEDULE_STATES.WAITING;
            this.nextStart = this.anchor;
            this.nextEnd = this.anchor + this.duration;
        } else {
            // seek lastCycleStart, lastRoutineStart, cycleExecutions, routineExecutions
            let lastCycleStart, lastRoutineStart;
            if (this.executeOnce) {
                this.cycleExecutions = 1;
                lastRoutineStart = lastCycleStart = this.anchor;
            }
            else {
                this.cycleExecutions = Math.floor(((this.until && (this.until < currentDate) ? this.until : currentDate) - this.anchor) / this.cycleTime + 1);
                if (this.cycleLimit)
                    this.cycleExecutions = Math.min(this.cycleLimit, this.cycleExecutions);
                lastRoutineStart = lastCycleStart = this.anchor + (this.cycleExecutions - 1) * this.cycleTime;
            }
            let doubleRoutineCount = (this.cycleExecutions - 1) * this.cycle.length;
            // console.log("Seeing function check:", this.anchor, this.cycleExecutions, this.cycleTime, lastCycleStart, this.totalduration, this.totalbreak);
            let cumulated = 0;
            for (i = 0; i < this.cycle.length; i++) {
                if (lastRoutineStart + (cumulated + this.cycle[i]) > currentDate) {
                    // this.routinePtr is only valid (> 0) when a routine will happen across the current date
                    this.routinePtr = i;
                    doubleRoutineCount += i;
                    lastRoutineStart = lastCycleStart + cumulated;
                    break;
                }
                cumulated += this.cycle[i];
            }
            this.routineExecutions = Math.floor(doubleRoutineCount / 2) + 1;
            if (this.limit)
                this.routineExecutions = Math.min(this.limit, this.routineExecutions);

            if (this.executeOnce || // cond. 2: cycle length 0 and executed once
                (this.limit && this.limit >= 0 && this.routineExecutions >= this.limit) || // cond. 3: execution limit reached
                (this.until && currentDate >= this.until)) { // cond. 4: date limit reached
                if (this.routinePtr % 2 === 1 || lastRoutineStart + this.getPeriod() < currentDate) { // cond: not ongoing
                    this.currentState = SCHEDULE_STATES.STOPPED;
                } else {
                    this.currentState = SCHEDULE_STATES.ONGOING;
                    this.nextEnd = lastRoutineStart + this.getPeriod();
                }
            } else { // cond. 5: no limits reached
                if (this.routinePtr % 2 === 1) { // cond: not ongoing
                    this.currentState = SCHEDULE_STATES.WAITING;
                    this.nextStart = lastRoutineStart + this.getPeriod();
                    this.nextEnd = this.nextStart + this.getPeriod(1);
                } else {
                    this.currentState = SCHEDULE_STATES.ONGOING;
                    this.nextEnd = lastRoutineStart + this.getPeriod();
                    this.nextStart = this.nextEnd + this.getPeriod(1);
                }
            }
        }
        // console.log("Seeking:", lastCycleStart, lastRoutineStart, this.cycleExecutions, this.routineExecutions)
        // console.log("Basic information:", this.anchor.valueOf(), this.cycle.map(v => v.valueOf()));
        // console.log("Limits:", currentDate.valueOf(), this.executeOnce, (this.until || 0).valueOf(), this.limit);
        // console.log("State information:", this.currentState, this.nextStart, this.nextEnd);
        // Trigger event
        if (this.currentState === SCHEDULE_STATES.ONGOING)
            this.onEventStart(true);
        else
            this.onEventEnd();
    }
    pause() {
        for (let i in this.timeoutStack)
            clearTimeout(this.timeoutStack[i]);
        this.timeoutStack = [];
    }
    removeTimeout(id) {
        this.timeoutStack.splice(this.timeoutStack.indexOf(id), 1);
    }
    addEvent(eventState, callback) {
        if (Object.values(SCHEDULE_STATES).includes(eventState)) {
            this.tasksId++;
            this.tasks[this.tasksId] = {
                event: eventState,
                cb: callback
            };
            if (this.currentState === eventState)
                callback(this.currentState);
            return this.tasksId;
        }
    }
    removeEvent(id) {
        if (id in tasks) {
            delete this.tasks[id];
            return true;
        }
        return false;
    }
    getPeriod(forward) {
        if (this.routinePtr < 0)
            return 0;
        return this.cycle[(this.routinePtr + (forward || 0)) % this.cycle.length];
    }
    advancePeriod(forward) {
        this.routinePtr = (this.routinePtr + (forward || 0)) % this.cycle.length;
    }
    onEventStart(noStateChanges) {
        // State Changes
        if (!noStateChanges) {
            this.nextStart = this.nextEnd + this.getPeriod(1); // Note: Calculation dependent on last state
            if ((this.limit && this.routineExecutions >= this.limit) || // reached execution limit
                (this.until && this.nextStart >= this.until)) // next start time reached/over date limit
                this.nextStart = null;
            this.currentState = SCHEDULE_STATES.ONGOING;
            this.advancePeriod(1);
            this.routineExecutions++;
            this.cycleExecutions += this.routinePtr === 0 ? 1 : 0;
        }
        // Call Tasks
        this.callEventSet(SCHEDULE_STATES.ONGOING);
        // Activate Next
        // console.log("onEventStart passing the ball to onEventEnd")
        // console.log(this.next_end, this.next_start)
        this.passTheBall(this.onEventEnd.bind(this), this.nextEnd);
    }
    onEventEnd() {
        if (!this.nextStart) {
            // State Changes
            this.nextEnd = null;
            this.currentState = SCHEDULE_STATES.STOPPED;
            // Call Tasks
            this.callEventSet(SCHEDULE_STATES.STOPPED);
        } else {
            // State Changes
            this.nextEnd = this.nextStart + this.getPeriod(1);
            this.currentState = SCHEDULE_STATES.WAITING;
            this.advancePeriod(1);
            // Call Tasks
            this.callEventSet(SCHEDULE_STATES.WAITING);
            // Activate Next
            // console.log("onEventEnd passing the ball to onEventStart")
            // console.log(this.next_start)
            this.passTheBall(this.onEventStart.bind(this), this.nextStart);
        }
    }
    passTheBall(callback, startSkyDate) {
        let now = new SkyDate();
        let till = Math.floor(Math.max(startSkyDate - now, 0) / RATIOS.magic * 1000); // convert SBST seconds to UTC milliseconds
        // console.log("Setting a function to call in ms: " + till)
        let _this = this;
        // Only schedule tasks within one day
        if (till < 86400000) {
            let tout = setTimeout(function () {
                callback();
                _this.removeTimeout(tout);
            }, till);
            _this.timeoutStack.push(tout);
        }
    }
    callEventSet(eventset) {
        // console.log("Calling event set: " + eventset);
        for (let i in this.tasks)
            if (this.tasks[i].event === eventset)
                this.tasks[i].cb(this.currentState);
    }
    startCountdown(callback) {
        let _this = this;
        // align to system clock
        let countTo = Math.min(this.nextStart, this.nextEnd) / RATIOS.magic,
            countToDate = new SkyDate(new SkyDuration(LOCALES.utc, countTo));
        let alignTout = setTimeout(function () {
            clearTimeout(alignTout);
            // now start actual countdown
            let registered = false;
            let countdownIntr = setInterval(function () {
                if (!registered) {
                    _this.timeoutStack.push(countdownIntr);
                    registered = true;
                }
                let now = Date.now() / 1000 - SKYBLOCK_EPOCH.UNIX_TS_UTC;
                let utcSecondsRemain = Math.floor(countTo - now);
                if (utcSecondsRemain <= 0)
                    clearTimeout(countdownIntr);
                callback(utcSecondsRemain, countdownIntr, countToDate, _this.currentState);
            }, 1000);
            // call it the first time
            let now = Date.now() / 1000 - SKYBLOCK_EPOCH.UNIX_TS_UTC;
            let utcSecondsRemain = Math.floor(countTo - now);
            callback(utcSecondsRemain, countdownIntr, countToDate, _this.currentState);
        }, (new Date()).valueOf() % 1000);
    }
    static routineTextParser(str) {
        let match;
        return {
            cycle: (match = str.match(/(?:\s|^)C\[(.*?)\]/)) ? match[1] : undefined, // pipe-separated list of duration expr or number
            limit: (match = str.match(/(?:\s|^)L\[(.*?)\]/)) ? match[1] : undefined, // a number
            until: (match = str.match(/(?:\s|^)U\[(.*?)\]/)) ? match[1] : undefined, // a date expr
            anchor: (match = str.match(/(?:\s|^)A\[(.*?)\]/)) ? match[1] : undefined // a date expr
        }
    }
}