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
exports.DHT22Temp = void 0;
const crypto_1 = require("crypto");
const deviceproto_1 = __importDefault(require("./deviceproto"));
const node_dht_sensor_1 = __importDefault(require("node-dht-sensor"));
class DHT22Temp extends deviceproto_1.default {
    initPin() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    draftRead() {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
}
exports.DHT22Temp = DHT22Temp;
