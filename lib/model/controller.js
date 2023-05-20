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
const telegraf_1 = require("telegraf");
class Controller {
    constructor(props) {
        var _a, _b, _c, _d;
        this.props = props;
        if (this.props.notifications) {
            const tgToken = this.props.notifications.tgToken ? this.props.notifications.tgToken : process.env.tgToken;
            if (tgToken) {
                this.tgBot = new telegraf_1.Telegraf(tgToken);
            }
        }
        this.devs = [];
        console.log(`Controller '${this.props.controller.name}' is starting...`);
        if ((_a = this.props.notifications) === null || _a === void 0 ? void 0 : _a.startController)
            this.notify(`is starting...`);
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
                default:
                    if ((_b = this.props.notifications) === null || _b === void 0 ? void 0 : _b.unknownHardware)
                        this.notify(`Unknown device found. Hardware='${device.hardware}'; type='${device.type}'`);
                    throw new error_1.default("hardware:unknowndevice", JSON.stringify(device));
            }
            this.devs.push(d);
            if ((_c = this.props.notifications) === null || _c === void 0 ? void 0 : _c.startDevice)
                this.notify(`Device started. Device='${device.name}'`);
            let c = this;
            d.on('change', (device) => {
                console.log(`Value changed event device.id='${device.id}', value='${device.value}'`);
            });
            d.on('report', (device) => {
                console.log(`Device report: id='${device.id}', value='${device.value}'`);
                c.reportDevice(device);
            });
        }
        this.reportToServer("initcontroller", this.props, (data) => console.log(JSON.stringify(data)), (res) => console.log(JSON.stringify(res)));
        if ((_d = this.props.notifications) === null || _d === void 0 ? void 0 : _d.startController)
            this.notify(`has started successfully`);
        console.log(`Controller '${this.props.controller.name}' has started successfully`);
    }
    reportToServer(command, data, successcb, failcb) {
        let url = this.props.server.url;
        (0, node_fetch_1.default)(`${url}/${command}`, {
            headers: [
                ["auth_shome", this.props.server.auth_SHOME],
                ["Content-Type", "application/json"]
            ],
            method: "POST",
            redirect: "follow",
            body: JSON.stringify(data)
        }).then(res => {
            //success async
            //console.log(res);
            if (res.ok)
                return res.json();
            //failcb(res);
            return Promise.reject(new error_1.default("report:fetcherror", `status='${res.status}', statusText='${res.statusText}'`));
        }).then(data => {
            //success data analyzing
            successcb(data);
        }).catch(err => {
            var _a;
            console.log(`Fetch error: message='${err.message}', server_url='${url}', command='${command}', data='${JSON.stringify(data)}'`);
            failcb(err);
            if ((_a = this.props.notifications) === null || _a === void 0 ? void 0 : _a.reportToServerFailed)
                this.notify(`reportToServerFailed: command='${command}', data='${JSON.stringify(data)}'; Fetch error: message='${err.message}', server_url='${url}'`);
        });
    }
    reportDevice(device) {
        let rd = {
            timestamp: new Date(),
            devices: []
        };
        rd.devices.push(device.prepareDataToReport());
        this.reportToServer("devicereport", rd, (data) => {
            console.log(`Success ${device.id}; data='${JSON.stringify(data)}'`);
            device.createReportTimer();
        }, (res) => {
            console.log(`FAIL ${device.id}; res='${res.status}'`);
        });
    }
    notify(message) {
        var _a, _b, _c, _d, _e, _f;
        if (!((_a = this.props.notifications) === null || _a === void 0 ? void 0 : _a.on))
            return;
        if ((_b = this.props.notifications) === null || _b === void 0 ? void 0 : _b.tgUsers) {
            for (const v of (_e = (_d = (_c = this.props) === null || _c === void 0 ? void 0 : _c.notifications) === null || _d === void 0 ? void 0 : _d.tgUsers) === null || _e === void 0 ? void 0 : _e.values())
                (_f = this.tgBot) === null || _f === void 0 ? void 0 : _f.telegram.sendMessage(v, `Controller='${this.props.controller.name}'; ${message}`);
        }
    }
}
exports.default = Controller;
