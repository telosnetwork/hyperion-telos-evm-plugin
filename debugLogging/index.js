"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DebugLogger {
    constructor(loggingEnabled) {
        if (loggingEnabled) {
            this.loggingEnabled = true;
        }
        else {
            this.loggingEnabled = false;
        }
    }
    /**
    * Adds an element to a bit vector of a 64 byte bloom filter.
    * @param s - The string to console log
    */
    log(s) {
        if (this.loggingEnabled == true) {
            console.log(s);
        }
    }
}
exports.default = DebugLogger;
//# sourceMappingURL=index.js.map