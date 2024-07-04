import { SkyRoutine } from "./SkyRoutine.js";
import { SkyDate } from "./SkyDate.js";
import { h } from "./SBTEHelpers.js";

/**
 * **SkyAlpha**
 * This script creates children classes with the time is shifted to match the time system on the Alpha Network of present time
 * Classes: SkyDateAlpha, SkyRoutineAlpha
 * Dependencies: SkyDuration, SkyDate, SkyRoutine
 */

/*** SkyDateAlpha ***/
class SkyDateAlpha extends SkyDate {
    EPOCH = h.ALPHA_SKYBLOCK_EPOCH;

    constructor() {
        SkyDate.apply(this, arguments);
    }
}

/*** SkyRoutineAlpha ***/
class SkyRoutineAlpha {
    EPOCH = ALPHA_SKYBLOCK_EPOCH;

    constructor() {
        SkyRoutine.apply(this, arguments);
    }

    SkyDateConstructor = SkyDateAlpha;
}

/* Exports */
export { SkyDateAlpha, SkyRoutineAlpha };
