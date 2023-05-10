"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SHOMEError extends Error {
    constructor(code, desc) {
        super(`${code} - ${desc}`);
        this.code = code;
        this.desc = desc;
    }
}
exports.default = SHOMEError;
