"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_events_1 = __importDefault(require("node:events"));
const error_1 = __importDefault(require("./error"));
class DeviceProto {
    constructor(name, pin, msFreqReport, msFreqRead) {
        this.name = name;
        this.pin = pin;
        this.msFreqReport = msFreqReport;
        this.msFreqRead = msFreqRead ? msFreqRead : msFreqReport;
        this.initPin();
        this.eventEmitter = new node_events_1.default();
    }
    initPin() {
        throw new error_1.default("abstract:notimplemented", `initPin function`);
    }
    draftRead() {
        throw new error_1.default("abstract:notimplemented", `draftRead function`);
    }
}
exports.default = DeviceProto;
