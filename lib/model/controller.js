"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dht_1 = require("./dht");
const error_1 = __importDefault(require("./error"));
const motionsensor_1 = require("./motionsensor");
const rpio_1 = __importDefault(require("rpio"));
const node_fetch_1 = __importDefault(require("node-fetch"));
class Controller {
    constructor(props) {
        this.props = props;
        this.devs = [];
        console.log(`Controller '${this.props.controller.name}' is starting...`);
        rpio_1.default.init({ mapping: 'gpio' });
        for (const [i, device] of Object.entries(props.devices)) {
            console.log(`${i}: Checking device id='${device.id}'; name='${device.name}'`);
            let d;
            switch (`${device.hardware}:${device.type}`) {
                case 'DHT22:Temp':
                    d = new dht_1.DHT22Temp(device);
                    break;
                case 'DHT22:Hum':
                    d = new dht_1.DHT22Hum(device);
                    break;
                case 'PIR:Motion':
                    d = new motionsensor_1.PIRMotion(device);
                    break;
                default: throw new error_1.default("hardware:unknowndevice", JSON.stringify(device));
            }
            this.devs.push(d);
            let c = this;
            d.on('change', (device) => {
                console.log(`Value changed event device.id='${device.id}', value='${device.value}'`);
            });
            d.on('report', (device) => {
                console.log(`Device report: id='${device.id}', value='${device.value}'`);
                c.reportToServer(device);
            });
        }
        console.log(`Controller '${this.props.controller.name}' is started successfully`);
    }
    reportToServer(device) {
        let rd = {
            timestamp: new Date(),
            devices: []
        };
        rd.devices.push(device.prepareDataToReport());
        (0, node_fetch_1.default)(`${this.props.server.url}/`, {
            headers: [
                ["auth_shome", this.props.server.auth_SHOME],
                ["Content-Type", "application/json"]
            ],
            method: "POST",
            redirect: "follow",
            body: JSON.stringify(rd)
        }).then(res => {
            //success async
            //console.log(res);
            if (res.ok)
                return res.json();
            console.log(`FAIL ${device.id}; res='${res.status}'`);
            return Promise.reject(res);
        }).then(data => {
            //success data analyzing
            console.log(`Success ${device.id}; data='${JSON.stringify(data)}'`);
            device.createReportTimer();
        }).catch(reason => {
            console.log(`CATCH ${device.id}; ${reason}`);
        });
    }
    reportToTG() {
    }
}
exports.default = Controller;
