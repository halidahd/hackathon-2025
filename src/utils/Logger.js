// src/utils/Logger.js
export const Logger = {
    info: (...args) => console.log("[INFO]", ...args),
    warn: (...args) => console.warn("[WARN]", ...args),
    error: (...args) => console.error("[ERR]", ...args),
    debug: (...args) => console.debug("[DBG]", ...args)
};
