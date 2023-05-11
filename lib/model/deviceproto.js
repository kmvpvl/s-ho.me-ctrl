"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const error_1 = __importDefault(require("./error"));
class DeviceProto {
    constructor(props) {
        this.props = props;
        this.eventEmitter = new events_1.default();
        this.createReadTimer();
        console.log(`Device ${props.id} (${props.name}: type=${props.type}, hw=${props.hardware}, pin=${props.pin}) has just initialized. Emulation='${props.emulation}'`);
    }
    createReadTimer() {
        this.readTimerID = setTimeout((device) => {
            device.updateValue();
            device.createReadTimer();
        }, this.props.freqRead * 1000, this);
    }
    initPin() {
        throw new error_1.default("abstract:notimplemented", `initPin function`);
    }
    draftRead() {
        this.initPin();
        throw new error_1.default("abstract:notimplemented", `draftRead function`);
    }
    static setPrecision(n, precision) {
        return parseFloat(n.toFixed(precision));
    }
    updateValue() {
        const dvalue = this.draftRead();
        if ((this.value !== undefined && !this.props.threshold && !Math.abs(this.value - dvalue))
            || (this.value !== undefined && this.props.threshold && Math.abs(this.value - dvalue) < this.props.threshold)) {
            // value not changed or change in range of threshold, do nothing
        }
        else {
            this._value = dvalue;
            this.eventEmitter.emit('value_changed', this);
        }
    }
    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }
    get value() {
        return this.props.precision !== undefined && this._value !== undefined ? DeviceProto.setPrecision(this._value, this.props.precision) : this._value;
    }
    get id() {
        return this.props.id;
    }
}
exports.default = DeviceProto;
