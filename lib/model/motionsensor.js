"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PIRMotion = void 0;
const crypto_1 = require("crypto");
const deviceproto_1 = __importDefault(require("./deviceproto"));
//import {promise as gpio} from 'rpi-gpio';
const rpio_1 = __importDefault(require("rpio"));
class PIRMotion extends deviceproto_1.default {
    initPin() {
        rpio_1.default.open(this.props.pin, rpio_1.default.INPUT);
    }
    draftRead() {
        let data;
        if (!this.props.emulation) {
            const d = rpio_1.default.read(this.props.pin);
            data = d ? 1 : 0;
        }
        else {
            data = (0, crypto_1.randomInt)(0, 2);
        }
        console.log(`Draft read device id='${this.props.id}'; on=${data}`);
        return this.props.precision ? deviceproto_1.default.setPrecision(data, this.props.precision) : data;
    }
}
exports.PIRMotion = PIRMotion;
