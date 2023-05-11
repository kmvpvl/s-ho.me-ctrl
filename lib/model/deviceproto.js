"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
        console.log(`Device ${props.id} (${props.name}: type=${props.type}, hw=${props.hardware}, pin=${props.pin}) has just initialized`);
    }
    createReadTimer() {
        this.readTimerID = setTimeout((device) => {
            device.updateValue();
            device.createReadTimer();
        }, this.props.freqRead * 1000, this);
    }
    initPin() {
        return __awaiter(this, void 0, void 0, function* () {
            throw new error_1.default("abstract:notimplemented", `initPin function`);
        });
    }
    draftRead() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.initPin();
            throw new error_1.default("abstract:notimplemented", `draftRead function`);
        });
    }
    static setPrecision(n, precision) {
        return parseFloat(n.toFixed(precision));
    }
    updateValue() {
        return __awaiter(this, void 0, void 0, function* () {
            const dvalue = yield this.draftRead();
            if ((this._value !== undefined && !this.props.threshold && !Math.abs(this._value - dvalue))
                || (this._value !== undefined && this.props.threshold && Math.abs(this._value - dvalue) < this.props.threshold)) {
                // value not changed or change in range of threshold, do nothing
            }
            else {
                this._value = dvalue;
                this.eventEmitter.emit('value_changed', this);
            }
        });
    }
    on(event, callback) {
        this.eventEmitter.on(event, callback);
    }
    get value() {
        return this._value;
    }
    get id() {
        return this.props.id;
    }
}
exports.default = DeviceProto;
