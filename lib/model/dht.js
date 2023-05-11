"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DHT22Temp = void 0;
const crypto_1 = require("crypto");
const deviceproto_1 = __importDefault(require("./deviceproto"));
const node_dht_sensor_1 = __importDefault(require("node-dht-sensor"));
class DHT22Temp extends deviceproto_1.default {
    initPin() {
    }
    draftRead() {
        let data;
        if (!this.props.emulation) {
            data = node_dht_sensor_1.default.read(22, 4);
        }
        else {
            data = {
                temperature: this._value !== undefined ? this._value + (0, crypto_1.randomInt)(-1, 2) / 10.0 : (0, crypto_1.randomInt)(-29, 30),
                humidity: NaN
            };
        }
        console.log(`Draft read device id='${this.props.id}'; temp=${data.temperature}`);
        return this.props.precision ? deviceproto_1.default.setPrecision(data.temperature, this.props.precision) : data.temperature;
    }
}
exports.DHT22Temp = DHT22Temp;
