"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DHT22Hum = exports.DHT22Temp = void 0;
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
        return data.temperature;
    }
}
exports.DHT22Temp = DHT22Temp;
class DHT22Hum extends deviceproto_1.default {
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
                humidity: this._value !== undefined ? this._value + (0, crypto_1.randomInt)(0, 3) / 10.0 : (0, crypto_1.randomInt)(0, 50)
            };
        }
        return data.humidity;
    }
}
exports.DHT22Hum = DHT22Hum;
