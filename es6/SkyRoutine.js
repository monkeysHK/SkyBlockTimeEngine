/**
 * @name SkyBlockTimeEngine (ES6 Version)
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version beta
 */
/**
 * **SkyRoutine**  
 * Helper Class: Defines one routine for SkyScheduler.  
 * Dependencies: SkyDuration, SkyDate  
 */
class SkyRoutine {
    /* INDEX */
    timeoutStack = []
    constructor(str) {
        this.definition = str;
    }
    trigger(str) {
        this.definition = str || this.definition;
        let data = SkyRoutine.routineTextParser(this.definition);
        // Calculations
        let chosenLocale = checkLocale(data.anchor) || LOCALES.sbst;
        this.anchor = new SkyDate(data.anchor); // a SkyDate used as number
        this.duration = data.duration !== "" && !isNaN(data.duration) ? new SkyDuration(chosenLocale, data.duration) : new SkyDuration(data.duration || 0); // a SkyDuration used as number
        this.interval = data.interval !== "" && !isNaN(data.interval) ? new SkyDuration(chosenLocale, data.interval) : new SkyDuration(data.interval || 0); // a SkyDuration used as number
        if (this.interval < 1 || !isNaN(data.limit))
            this.limit = this.interval < 1 ? 1 /* no interval: force limit of 1 */ : Number(data.limit);
        if (!!data.until)
            this.until = new SkyDate(data.until); // a SkyDate used as number
        // Get Initial State
        let current_date = new SkyDate();
        // execution_count and last_start may be invalid when not started, no interval
        this.execution_count = Math.max(0, Math.floor(((this.until && (this.until < current_date) ? this.until : current_date) - this.anchor) / this.interval) + 1);
        if (this.limit)
            this.execution_count = Math.min(this.limit, this.execution_count);
        let last_start = this.anchor + (this.execution_count - 1) * (this.interval || 0);
        if (this.interval >= 1 && this.duration > this.interval)
            this.duration = this.interval; // duration can't be greater than interval (if exists)
        // in the case with no interval, it's either not started (cond. 1) or executed once (cond. 2), with no fall through to where interval or last_start is used
        if (current_date < this.anchor) { // cond. 1: not started
            this.current_state = SCHEDULE_STATES.WAITING;
            this.next_start = this.anchor;
            this.next_end = this.anchor + this.duration;
        } else if (this.interval < 1 || // cond. 2: no interval and executed once
            (this.limit && this.limit >= 0 && this.execution_count >= this.limit) || // cond. 3: execution limit reached
            (this.until && current_date >= this.until)) { // cond. 4: date limit reached
            if ((last_start || this.anchor) + this.duration < current_date) { // cond: not ongoing
                this.current_state = SCHEDULE_STATES.STOPPED;
            } else {
                this.current_state = SCHEDULE_STATES.ONGOING;
                this.next_end = (last_start || this.anchor) + this.duration;
            }
        } else { // cond. 5: no limits reached
            if (last_start + this.duration < current_date) { // cond: not ongoing
                this.current_state = SCHEDULE_STATES.WAITING;
                this.next_start = last_start + this.interval;
                this.next_end = last_start + this.interval + this.duration;
            } else {
                this.current_state = SCHEDULE_STATES.ONGOING;
                this.next_end = last_start + this.duration;
                this.next_start = last_start + this.interval;
            }
        }
        // console.log("Basic information:", this.anchor.valueOf(), this.interval.valueOf(), this.duration.valueOf())
        // console.log("Limits:", this.execution_count, current_date.valueOf(), (this.until || 0).valueOf(), this.limit)
        // console.log("State information:", this.current_state, last_start, this.next_start, this.next_end);
        // Trigger event
        if (this.current_state === SCHEDULE_STATES.ONGOING)
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
    attachScheduler(dispatcher, id) {
        this.scheduler = dispatcher;
        this.schedulerIndex = id;
    }
    reportToScheduler() {
        if (this.scheduler) {
            this.scheduler.triggerGrandState(this.schedulerIndex, this.current_state);
        }
    }
    onEventStart(noStateChanges) {
        // State Changes
        if (!noStateChanges) {
            this.next_start = this.next_start + this.interval; // Note: Calculation dependent on last state
            if ((this.limit && this.execution_count >= this.limit) || // reached execution limit
                (this.until && this.next_start >= this.until)) // next start time reached/over date limit
                this.next_start = null;
            this.current_state = SCHEDULE_STATES.ONGOING;
            this.execution_count++;
        }
        // Report State
        this.reportToScheduler();
        // Activate Next
        // console.log("onEventStart passing the ball to onEventEnd")
        // console.log(this.next_end, this.next_start)
        this.passTheBall(this.onEventEnd.bind(this), Math.min(this.next_end, this.next_start /* smallest comes first: duration/interval */ ));
    }
    onEventEnd() {
        if (!this.next_start) {
            // State Changes
            this.next_end = null;
            this.current_state = SCHEDULE_STATES.STOPPED;
            // Report State
            this.reportToScheduler();
        } else {
            // State Changes
            this.next_end = this.next_start + this.duration;
            this.current_state = SCHEDULE_STATES.WAITING;
            // Report State
            this.reportToScheduler();
            // Activate Next
            // console.log("onEventEnd passing the ball to onEventStart")
            // console.log(this.next_start)
            this.passTheBall(this.onEventStart.bind(this), this.next_start);
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
    static routineTextParser(str) {
        let match;
        return {
            duration: (match = str.match(/(?:\s|^)T\[(.*?)\]/)) ? match[1] : 0, // a duration expr or number
            interval: (match = str.match(/(?:\s|^)I\[(.*?)\]/)) ? match[1] : undefined, // a duration expr or number
            limit: (match = str.match(/(?:\s|^)L\[(.*?)\]/)) ? match[1] : undefined, // a number
            until: (match = str.match(/(?:\s|^)U\[(.*?)\]/)) ? match[1] : undefined, // a date expr
            anchor: (match = str.match(/(?:\s|^)A\[(.*?)\]/)) ? match[1] : undefined // a date expr
        }
    }
}