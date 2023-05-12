export type ErrorCode = "abstract:notimplemented" |
"abstract:unknown" |
"hardware:unknowndevice" |
"report:deviceisnotreadytoreport";
export default class SHOMEError extends Error {
    protected code: ErrorCode;
    protected desc?: string;
    constructor(code: ErrorCode, desc?: string) {
        super(`${code} - ${desc}`);
        this.code = code;
        this.desc = desc;
    }

}
