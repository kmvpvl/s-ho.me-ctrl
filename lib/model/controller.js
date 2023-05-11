"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dht_1 = require("./dht");
const error_1 = __importDefault(require("./error"));
const motionsensor_1 = require("./motionsensor");
class Controller {
    constructor(props) {
        this.props = props;
        this.devs = [];
        console.log(`Controller ${this.props.controller.name} is starting...`);
        for (const [i, device] of Object.entries(props.devices)) {
            console.log(`${i}: Checking device id='${device.id}'; name='${device.name}'`);
            let d;
            switch (`${device.hardware}:${device.type}`) {
                case 'DHT22:Temp':
                    d = new dht_1.DHT22Temp(device);
                    break;
                case 'PIR:Motion':
                    d = new motionsensor_1.PIRMotion(device);
                    break;
                default: throw new error_1.default("hardware:unknowndevice", JSON.stringify(device));
            }
            this.devs.push(d);
            d.on('value_changed', (device) => {
                console.log(`Value changed event device.id='${device.id}', value='${device.value}'`);
            });
        }
        console.log(`Controller ${this.props.controller.name} is started successfully`);
    }
}
exports.default = Controller;
