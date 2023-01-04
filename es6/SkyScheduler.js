/**
 * @name SkyBlockTimeEngine (ES6 Version)
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version beta
 */
/**
 * **SkyScheduler**  
 * A Routine Handler for both SkyBlock Time and UTC Time.  
 * Dependencies: SkyDuration, SkyDate, SkyRoutine  
 */
class SkyScheduler {
    /* INDEX */
    tasksId = -1
    tasks = [] // array of { event: <any STATES>, cb: function }
    timeoutStack = []
    routines = [] // array of SkyRoutine
    constructor(routine) {
        return this.loadRoutine(routine);
    }
    loadRoutine(routine) {
        if (!Array.isArray(routine))
            routine = [routine];
        for (var i in routine) {
            var len = this.routines.push(routine[i] instanceof SkyRoutine ? routine[i] : new SkyRoutine(routine[i]));
            this.routines[len - 1].attachScheduler(this, len - 1);
        }
        this.verified = false;
    }
    grandTrigger() {
        // Trigger children routines before triggering master
        for (let i in this.routines)
            this.routines[i].trigger();
        this.masterSwitch = true;
        this.triggerGrandState(-1, -1);
    }
    grandPause() {
        for (let i in this.routines)
            this.routines[i].pause();
        for (let i in this.timeoutStack)
            clearTimeout(this.timeoutStack[i]);
        this.timeoutStack = [];
    }
    removeTimeout(id) {
        this.timeoutStack.splice(this.timeoutStack.indexOf(id), 1);
    }
    triggerGrandState(id, new_state) {
        // id and new_state are provided by SkyRoutine::reportToScheduler
        if (!this.masterSwitch || this.grand_state === SCHEDULE_STATES.ERRORED)
            return;
        var stateCounts = Array(Object.keys(SCHEDULE_STATES).length).fill(0);
        if (!this.verified && !this.verify()) {
            // overlap occurence => error, stop all.
            this.grandPause();
            this.callEventSet(this.grand_state = SCHEDULE_STATES.ERRORED);
            return;
        }
        for (var i in this.routines) {
            stateCounts[this.routines[i].current_state]++;
        }
        if (this.grand_state !== new_state) {
            this.grand_next_start = this.grand_next_end = null;
            if (stateCounts[SCHEDULE_STATES.STOPPED] === this.routines.length) {
                this.grand_state = SCHEDULE_STATES.STOPPED;
            } else if (stateCounts[SCHEDULE_STATES.ONGOING] === 1) {
                this.grand_state = SCHEDULE_STATES.ONGOING;
                this.seekNextStateChange(true);
            } else {
                this.grand_state = SCHEDULE_STATES.WAITING;
                this.seekNextStateChange(false);
            }
            this.callEventSet(this.grand_state);
        }
    }
    verify() {
        // Verify there is no overlapping ongoing event in the future
        var seekList = this.getSortedTimetable(); // array of [ time, type[start/end], id ]
        for (var i = 1; i < seekList.length; i++) {
            if (seekList[i - 1][1] === seekList[i][1])
                return false;
        }
        return true;
    }
    seekNextStateChange(rising_edge) {
        // Seek for grand_next_start and grand_next_end
        var seekList = this.getSortedTimetable(); // array of [ time, type[start/end], id ]
        for (var i in seekList) {
            if (!!seekList[i][0]) {
                // Note: for rising edge (0 -> 1), seek for next_start first.
                // For falling edge (1 -> 0), seek for next_end first.
                if (seekList[i][1] === "start" && !this.grand_next_start && (!rising_edge || !!this.grand_next_end))
                    this.grand_next_start = seekList[i][0];
                else if (seekList[i][1] === "end" && !this.grand_next_end && (rising_edge || !!this.grand_next_start))
                    this.grand_next_end = seekList[i][0];
            }
            if (this.grand_next_start && this.grand_next_end)
                break;
        }
    }
    getSortedTimetable() {
        // Utility: Get sorted timetable of next_start and next_end for all children routines
        var _this = this;
        var seekList = []; // array of [ time, type[start/end], id ]
        for (var id in this.routines) {
            seekList.push([this.routines[id].next_start, "start", id]);
            seekList.push([this.routines[id].next_end, "end", id]);
        }
        seekList.sort(function (a, b) {
            if (a[0] === b[0] && a[2] == b[2]) {
                // Immediate invokation cases, with Start/End at the same time.
                // Note: if duration === interval, End -> Start. If duration === 0, Start -> End
                var d = _this.routines[a[2]].duration;
                return (d > 0 && a[1] == "start") || (d < 0 && a[1] == "end")
            } else if (a[0] === b[0])
                // group events of same ID together
                return a[2] > b[2] ? 1 : -1;
            else
                return a[0] > b[0] ? 1 : -1;
        });
        return seekList;
    }
    addEvent(eventState, callback) {
        if (Object.values(SCHEDULE_STATES).includes(eventState)) {
            this.tasksId++;
            this.tasks[this.tasksId] = {
                event: eventState,
                cb: callback
            };
            if (this.grand_state === eventState)
                callback(this.grand_state);
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
    callEventSet(eventset) {
        // console.log("Calling event set: " + eventset);
        for (let i in this.tasks)
            if (this.tasks[i].event === eventset)
                this.tasks[i].cb(this.grand_state);
    }
    startCountdown(callback) {
        let _this = this;
        // align to system clock
        var countTo = Math.min(this.grand_next_start, this.grand_next_end) / RATIOS.magic,
            countToDate = new SkyDate(new SkyDuration(LOCALES.utc, countTo));
        var alignTout = setTimeout(function () {
            clearTimeout(alignTout);
            // now start actual countdown
            var registered = false;
            var countdownIntr = setInterval(function () {
                if (!registered) {
                    _this.timeoutStack.push(countdownIntr);
                    registered = true;
                }
                var now = Date.now() / 1000 - SKYBLOCK_EPOCH.UNIX_TS_UTC;
                var utcSecondsRemain = Math.floor(countTo - now);
                if (utcSecondsRemain <= 0)
                    clearTimeout(countdownIntr);
                callback(utcSecondsRemain, countdownIntr, countToDate, _this.grand_state);
            }, 1000);
            // call it the first time
            var now = Date.now() / 1000 - SKYBLOCK_EPOCH.UNIX_TS_UTC;
            var utcSecondsRemain = Math.floor(countTo - now);
            callback(utcSecondsRemain, countdownIntr, countToDate, _this.grand_state);
        }, (new Date()).valueOf() % 1000);
    }
}