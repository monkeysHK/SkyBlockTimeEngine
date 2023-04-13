
# SkyBlock Time Engine

SBTE is an open-sourced web time engine for the time system in Hypixel SkyBlock.

This script was originally created for the [Hypixel SkyBlock Wiki](https://hypixel-skyblock.fandom.com/).

## Usage Example
For standard web integration, see the es5-module/examples folder (along with source in the es5-module/src folder). Note: To open it on your own machine, due to browser's CORS policy, you might have to use [VSCode Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) or other workarounds.

For MediaWiki integration, see the [TimingEvents](https://hypixel-skyblock.fandom.com/wiki/MediaWiki:Gadget-TimingEvents.js) implementation (along with source in the es5-mediawiki folder). It uses [mw.hook](https://doc.wikimedia.org/mediawiki-core/master/js/#!/api/mw.hook) to ensure correct running sequence.

## Content
There are six custom classes defined in the files to facilitate web integration of the Hypixel SkyBlock Standard Time (SBST, "SkyBlock time"). The design is modular; meaning it starts from a module handling durations, then dates, then routines.

Traditionally, SkyDate supported [Main Server time](https://hypixel-skyblock.fandom.com/wiki/Time_Systems). Prototype-based inheritance in JavaScript made adjusting to [Alpha Server time](https://hypixel-skyblock.fandom.com/wiki/Alpha_Hypixel_Network#Time_on_Alpha_Network) very easy.

When "file" is mentioned in the following table, it is refering to the es5-module implementation.

| Class | Description | Defined in file | Dependent classes |
| ----- | ----------- | --------------- | ----------------- |
| SkyDuration | Represents a duration and handles conversions between SBST and UTC. | SkyDuration.js |  |
| SkyDate | Represents a date and handles conversions between SBST, UTC and LOCAL. Uses Main Server time. | SkyDate.js | SkyDuration |
| SkyRoutine | Stores and handles transactions of a routine. Uses Main Server time. | SkyRoutine.js | SkyDuration, SkyDate |
| SkyDateAlpha | The same as SkyDate, but uses the Alpha Server time. | AlphaExt.js | SkyDuration, SkyDate |
| SkyRoutineAlpha | The same as SkyRoutine, but uses the Alpha Server time. | AlphaExt.js | SkyDuration, SkyDate, SkyRoutine |

### Locale
A locale determines the length of time measuring units. Both SkyDuration and SkyDate support specification of locale at the end of the input string. Current supported locales are:
- UTC (Coordinated Universal Time). Specification: `-U`
- SBST (SkyBlock Standard Time). Specification: `-S`
For example, `7y 6d -S` means 7 Years and 6 Days in SBST. `D6 M9 2000 00:00 -U` means September 6, 2000 in UTC.

### SkyDuration Syntax
SkyDuration is a custom class which represents a duration. Fields in the duration can be defined with components in any order and are case insensitive. For example, `2y 3mo 1d 3h 2m 50s -U` is the same as `50S 2M 3H 1D 3Mo 2Y -U`.

A SkyDuration can be defined through UTC units or SBST units: A trailing [locale](#locale) specification can be added (if not specified, SBST units will be used).

| Unit | Written Form (# = number) | Default Value if not specified |
| ---- | ------------------------- | ------------------------------ |
| Year | #y | 0 |
| Month | #mo | 0 |
| Day | #d | 0 |
| Hour | #h | 0 |
| Minute | #m | 0 |
| Second | #s | 0 |

### SkyDate Syntax
SkyDate is a custom class which represents a date. Fields in the date can be defined with components in any order and are case insensitive. For example, `Y2019 M6 D12 17:00 -U` is the same as `17:00 D12 Jun Y2019 -U`.

A SkyDate can be defined through a UTC date or a SBST date: A trailing [locale](#locale) specification can be added (if not specified, locale is SBST).

All fields in the date can be optionally defined. The values will be determined by the table below:
| Unit | Written Form (# = number) | Value Range | Default Value when below Highest Defined Unit | Default Value when above Lowest Defined Unit or when nothing is defined |
| ---- | ------------------------- | ----------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| (Highest) Year | Y# | Any Number | (This value is the highest) | Current Year |
| Month | M# or Month_String (See conversion table below) | 1-12 | 1 | Current Month |
| Day | D# | 1-31 | 1 | Current Day |
| Hour | ##: | 0-23 | 0 | Current Hour |
| Minute | :## | 0-59 | 0 | Current Minute |
| (Lowest) Second | ::## | 0-59 | 0 | Current Second |

Therefore, for an exact, non-changing date representation, the year must be specified. In a SkyRoutine, an exact, non-changing date representation is always recommended.

Month_String Conversion Table:
<table>
<tr><th>Converts to</td><td colspan=3>Values accepted</th></tr>
<tr><td>The value of 1</td><td>M1</td><td>Jan</td><td>ESP</td></tr>
<tr><td>The value of 2</td><td>M2</td><td>Feb</td><td>SP</td></tr>
<tr><td>The value of 3</td><td>M3</td><td>Mar</td><td>LSP</td></tr>
<tr><td>The value of 4</td><td>M4</td><td>Apr</td><td>ESU</td></tr>
<tr><td>The value of 5</td><td>M5</td><td>May</td><td>SU</td></tr>
<tr><td>The value of 6</td><td>M6</td><td>Jun</td><td>LSU</td></tr>
<tr><td>The value of 7</td><td>M7</td><td>Jul</td><td>EAU</td></tr>
<tr><td>The value of 8</td><td>M8</td><td>Aug</td><td>AU</td></tr>
<tr><td>The value of 9</td><td>M9</td><td>Sep</td><td>LAU</td></tr>
<tr><td>The value of 10</td><td>M10</td><td>Oct</td><td>EWI</td></tr>
<tr><td>The value of 11</td><td>M11</td><td>Nov</td><td>WI</td></tr>
<tr><td>The value of 12</td><td>M12</td><td>Dec</td><td>LWI</td></tr>
</table>

### SkyRoutine Syntax
SkyRoutine is a custom class that handles transactions of a routine. It is responsible for parsing the routine input, and load and handle events.

A SkyRoutine is written in the following syntax: `A[...] C[...] L[...] U[...]`, where:

| Key | Meaning | Mandatory | Accepts Values |
| --- | ------- | --------- | -------------- |
| A | Anchor | Yes | A SkyDate representation of a date (See [SkyDate Syntax](#skydate-syntax)) |
| C | Cycle | No | A slash-separated list of SkyDuration or Number, in the form of `[ Run Time / Break Time / Run Time / Break Time ... ]` <br> The time is best represented in SkyDuration (See [SkyDuration Syntax](#skyduration-syntax)) <br> Alternatively, if specified in Number, it will be treated as number of seconds passed in *the locale chosen for the Anchor* (See [locale](#locale)) <br> **If not specified, or if the program found zero interval between events, the event will be limited to one execution.** |
| L | Limit | No | The maximum number of executions allowed. |
| U | Until | No | A date in SkyDate representation. No event will start past this date. |

SkyRoutine can trace the number of would-have executions before the browser run the code, and inserts itself into the correct state. The anchor date can be set anytime in the past. If the anchor date is in the future, SkyRoutine will wait until the anchor date to execute the first time.

## Changelog

| Version | Changes | Supported Files |
| ------- | ------- | ----- |
| 3.0 | Breaking change: Routine cycle separator changed from `\|` to `/` <br> Switched to using ECMAScript module | ES5-module, ES5-mediawiki |
| 2.1 | Undocumented. | ES5, ES5-mediawiki |
| 2.0 | Undocumented. | ES5, ES5-mediawiki |
| 1.0 | Undocumented. | ES5, ES6, ES5-mediawiki |
| beta 2 | Undocumented. | ES5, ES6 |
| beta 1 | Undocumented. | ES6 |
