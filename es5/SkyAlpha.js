/**
 * @name SkyBlockTimeEngine (ES5 Version)
 * @author MonkeysHK <https://github.com/MonkeysHK>
 * @description A web time engine for the time system in Hypixel SkyBlock.
 * @license GPL-3.0-or-later GNU General Public License v3.0 or later <https://www.gnu.org/licenses/gpl-3.0-standalone.html>
 * @version 2.0
 */
/**
 * **SkyAlpha**  
 * This script creates children classes with the time is shifted to match the time system on the Alpha Network of present time  
 * Classes: SkyDateAlpha, SkyRoutineAlpha  
 * Dependencies: SkyDuration, SkyDate, SkyRoutine  
 */

/*** SkyDateAlpha ***/
function SkyDateAlpha() {
    SkyDate.apply(this, arguments);
}
// Class Inheritance
Object.setPrototypeOf(
    SkyDateAlpha.prototype,
    SkyDate.prototype,
);
// Class Overrides
SkyDateAlpha.prototype.EPOCH = h.ALPHA_SKYBLOCK_EPOCH;

/*** SkyRoutineAlpha ***/
function SkyRoutineAlpha() {
    SkyRoutine.apply(this, arguments);
}
// Class Inheritance
Object.setPrototypeOf(
    SkyRoutineAlpha.prototype,
    SkyRoutine.prototype,
);
// Class Overrides
SkyRoutineAlpha.prototype.SkyDateConstructor = SkyDateAlpha;
SkyRoutineAlpha.prototype.EPOCH = h.ALPHA_SKYBLOCK_EPOCH;
