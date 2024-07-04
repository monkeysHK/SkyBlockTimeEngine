import { SkyDuration } from "./SkyDuration.js";
import { SkyDate } from "./SkyDate.js";
import { SkyRoutine } from "./SkyRoutine.js";
import { SkyDateAlpha, SkyRoutineAlpha } from "./AlphaExt.js";
import { h } from "./SBTEHelpers.js";

(function (window, $, mw) {
    "use strict";
    let wikiname = "hsbwiki";
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
        helpers: h,
    });

    // Attach mw.hook: fire event on load
    mw.hook(wikiname + ".sbte").fire(window[wikiname].sbte);
})(window, jQuery, mediaWiki);
