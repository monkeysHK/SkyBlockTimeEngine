/**
 * @name SkyBlockTimeEngine (ES5 Version)
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
function SkyRoutine(str) {
    this.tasksId = -1;
    this.tasks = []; // array of { event: <any STATES>, cb: function }
    this.timeoutStack = [];
    this.definition = str;
}
/*** MEMBER FUNCTIONS ***/
SkyRoutine.prototype.trigger = function(str) {
    this.definition = str || this.definition;
    var data = SkyRoutine.routineTextParser(this.definition);
    // Calculations
    var chosenLocale = checkLocale(data.anchor) || LOCALES.sbst;
    var i;
    this.anchor = new SkyDate(data.anchor); // a SkyDate used as number
    this.totalduration = this.totalbreak = this.cycleExecutions = this.routineExecutions = 0;
    this.routinePtr = -1;
    // Handle Cycle
    this.cycle = (data.cycle || "0|0").split("|");
    if (this.cycle.length % 2 === 1)
        this.cycle.push(0);
    for (i = 0; i < this.cycle.length; i++) {
        var v = this.cycle[i].toString().trim();
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
    var currentDate = new SkyDate();
    if (currentDate < this.anchor) { // cond. 1: not started; cycleExecutions and routineExecutions remains 0
        this.currentState = STATES.WAITING;
        this.nextEventTime = this.anchor;
    } else {
        // seek lastCycleStart, lastRoutineStart, cycleExecutions, routineExecutions
        var lastCycleStart, lastRoutineStart;
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
        if (this.limit)
            this.routineExecutions = Math.min(this.limit, this.routineExecutions);

        if (this.executeOnce || // cond. 2: cycle length 0 and executed once
            (this.limit && this.limit >= 0 && this.routineExecutions >= this.limit) || // cond. 3: execution limit reached
            (this.until && currentDate >= this.until)) { // cond. 4: date limit reached
            if (this.routinePtr % 2 === 1 || lastRoutineStart + this.getPeriod() < currentDate) { // cond: not ongoing
                this.currentState = STATES.STOPPED;
            } else {
                this.currentState = STATES.ONGOING;
                this.nextEventTime = lastRoutineStart + this.getPeriod();
            }
        } else { // cond. 5: no limits reached
            this.currentState = this.routinePtr % 2 === 0 ? STATES.ONGOING : STATES.WAITING;
            this.nextEventTime = lastRoutineStart + this.getPeriod();
        }
        // console.log("Seeking A:", lastCycleStart, lastRoutineStart);
    }
    // console.log("Seeking B:", this.cycleExecutions, this.routineExecutions);
    // console.log("Basic information:", this.anchor.valueOf(), this.cycle);
    // console.log("Limits:", currentDate.valueOf(), this.executeOnce, (this.until || 0).valueOf(), this.limit);
    // console.log("State information:", this.currentState, this.nextEventTime);
    // Trigger event
    if (this.currentState === STATES.ONGOING)
        this.onEventStart(true);
    else
        this.onEventEnd(true);
}
SkyRoutine.prototype.pause = function() {
    for (var i in this.timeoutStack)
        clearTimeout(this.timeoutStack[i]);
    this.timeoutStack = [];
}
SkyRoutine.prototype.removeTimeout = function(id) {
    this.timeoutStack.splice(this.timeoutStack.indexOf(id), 1);
}
SkyRoutine.prototype.addEvent = function(eventState, callback) {
    if (Object.values(STATES).includes(eventState)) {
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
SkyRoutine.prototype.removeEvent = function(id) {
    if (id in this.tasks) {
        delete this.tasks[id];
        return true;
    }
    return false;
}
SkyRoutine.prototype.getPeriod = function(forward) { // forward must be +ve integer
    if (this.routinePtr + (forward || 0) < 0)
        return 0;
    return this.cycle[(this.routinePtr + (forward || 0)) % this.cycle.length];
}
SkyRoutine.prototype.advancePeriod = function(forward) { // forward must be +ve integer
    this.routinePtr = (this.routinePtr + (forward || 0)) % this.cycle.length;
}
SkyRoutine.prototype.onEventStart = function(noStateChanges) {
    // State Changes
    if (!noStateChanges) {
        this.advancePeriod(1);
        this.nextEventTime += this.getPeriod(0); // Note: Calculation dependent on last state
        this.currentState = STATES.ONGOING;
        this.routineExecutions++;
        this.cycleExecutions += this.routinePtr === 0 ? 1 : 0;
    }
    // Call Tasks
    this.callEventSet(STATES.ONGOING);
    // Activate Next
    // console.log("onEventStart passing the ball to onEventEnd")
    // console.log(this.nextEventTime.valueOf(), this.routinePtr)
    this.passTheBall(this.onEventEnd.bind(this), this.nextEventTime);
    // Schedule future termination if limits reached
    if ((this.limit && this.routineExecutions >= this.limit) || // reached execution limit
        (this.until && this.nextEventTime >= this.until)) // next start time reached/over date limit
        this.nextEventTime = null;
}
SkyRoutine.prototype.onEventEnd = function(noStateChanges) {
    // Check termination
    if (!this.nextEventTime) {
        // State Changes
        this.currentState = STATES.STOPPED;
        // Call Tasks
        this.callEventSet(STATES.STOPPED);
        return;
    }
    // State Changes
    if (!noStateChanges) {
        this.advancePeriod(1);
        this.nextEventTime += this.getPeriod(0);
        this.currentState = STATES.WAITING;
    }
    // Call Tasks
    this.callEventSet(STATES.WAITING);
    // Activate Next
    // console.log("onEventEnd passing the ball to onEventStart")
    // console.log(this.nextEventTime.valueOf(), this.routinePtr)
    this.passTheBall(this.onEventStart.bind(this), this.nextEventTime);
}
SkyRoutine.prototype.passTheBall = function(callback, startSkyDate) {
    var now = new SkyDate();
    var till = Math.floor(Math.max(startSkyDate - now, 0) / RATIOS.magic * 1000); // convert SBST seconds to UTC milliseconds
    // console.log("Setting a function to call in ms: " + till)
    var _this = this;
    // Only schedule tasks within one day
    if (till < 86400000) {
        var tout = setTimeout(function () {
            callback();
            _this.removeTimeout(tout);
        }, till);
        _this.timeoutStack.push(tout);
    }
}
SkyRoutine.prototype.callEventSet = function(eventset) {
    // console.log("Calling event set: " + eventset);
    for (var i in this.tasks)
        if (this.tasks[i].event === eventset)
            this.tasks[i].cb(this.currentState);
}
SkyRoutine.prototype.startCountdown = function(callback) {
    var _this = this;
    // align to system clock
    var countTo = this.nextEventTime / RATIOS.magic,
        countToDate = new SkyDate(new SkyDuration(LOCALES.utc, countTo));
    var alignTout = setTimeout(function () {
        clearTimeout(alignTout);
        // now start actual countdown
        var countdownIntr = setInterval(function () {
            var now = Date.now() / 1000 - SKYBLOCK_EPOCH.UNIX_TS_UTC;
            var utcSecondsRemain = Math.floor(countTo - now);
            if (utcSecondsRemain <= 0)
                clearTimeout(countdownIntr);
            callback(utcSecondsRemain, countdownIntr, countToDate, _this.currentState);
        }, 1000);
        // call it the first time
        var now = Date.now() / 1000 - SKYBLOCK_EPOCH.UNIX_TS_UTC;
        var utcSecondsRemain = Math.floor(countTo - now);
        callback(utcSecondsRemain, countdownIntr, countToDate, _this.currentState);
    }, (new Date()).valueOf() % 1000);
}
/*** STATIC FUNCTIONS ***/
SkyRoutine.routineTextParser = function(str) {
    var match;
    return {
        cycle: (match = str.match(/(?:\s|^)C\[(.*?)\]/)) ? match[1] : undefined, // pipe-separated list of duration expr or number
        limit: (match = str.match(/(?:\s|^)L\[(.*?)\]/)) ? match[1] : undefined, // a number
        until: (match = str.match(/(?:\s|^)U\[(.*?)\]/)) ? match[1] : undefined, // a date expr
        anchor: (match = str.match(/(?:\s|^)A\[(.*?)\]/)) ? match[1] : undefined // a date expr
    }
}
