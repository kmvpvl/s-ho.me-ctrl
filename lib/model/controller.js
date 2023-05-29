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
const dht_1 = require("./dht");
const error_1 = __importDefault(require("./error"));
const motionsensor_1 = require("./motionsensor");
const rpio_1 = __importDefault(require("rpio"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const telegraf_1 = require("telegraf");
const colours_1 = __importDefault(require("./colours"));
class Controller {
    constructor(props) {
        var _a;
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
        this.reportToServer("initcontroller", this.props.controller, (data) => {
            var _a;
            //getting actual controller settings
            console.log(`${colours_1.default.fg.green}Gotten controller settings from server='${JSON.stringify(data)}'${colours_1.default.reset}`);
            // let me transfer properties from gotten structure to controller props
            for (let prop in data) {
                this.props.controller[prop] = data[prop];
            }
            this.initDevices();
            console.log(`${colours_1.default.fg.green}Controller '${this.props.controller.name}' has started successfully${colours_1.default.reset}`);
            if ((_a = this.props.notifications) === null || _a === void 0 ? void 0 : _a.startController)
                this.notify(`has started successfully`);
        }, (res) => {
            var _a;
            // error getting actual controller settings
            console.log(`${colours_1.default.fg.red}Error reading settings of controller from server='${JSON.stringify(res)}'${colours_1.default.reset}`);
            // let's start without server and collect values
            if (this.props.server.startOffline) {
                console.log(`${colours_1.default.fg.yellow}Controller '${this.props.controller.name}' has started alone${colours_1.default.reset}`);
                if ((_a = this.props.notifications) === null || _a === void 0 ? void 0 : _a.startController)
                    this.notify(`has started alone`);
                this.initDevices();
            }
            else {
                throw new error_1.default("start:restart", `Couldnot start controller`);
                //process.exit(1);
            }
        });
    }
    initDevices() {
        this.props.devices.forEach((device) => device.organizationid = this.props.server.shome_organizationid);
        this.reportToServer("initdevices", this.props.devices, (data) => {
            //getting actual devices settings
            console.log(`${colours_1.default.fg.green}Gotten devices settings from server='${JSON.stringify(data)}'${colours_1.default.reset}`);
            this.activateDevices();
        }, (res) => {
            // error getting actual devices settings
            console.log(`${colours_1.default.fg.red}Error reading settings of devices from server='${JSON.stringify(res)}'${colours_1.default.reset}`);
            if (this.props.server.startOffline) {
                this.activateDevices();
            }
            else {
                throw new error_1.default("start:restart", `Couldnot start devices`);
                //process.exit(1);
            }
        });
    }
    activateDevices() {
        var _a, _b;
        for (let i in this.props.devices) {
            const device = this.props.devices[i];
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
                    if ((_a = this.props.notifications) === null || _a === void 0 ? void 0 : _a.unknownHardware)
                        this.notify(`Unknown device found. Hardware='${device.hardware}'; type='${device.type}'`);
                    throw new error_1.default("hardware:unknowndevice", JSON.stringify(device));
            }
            this.devs.push(d);
            if ((_b = this.props.notifications) === null || _b === void 0 ? void 0 : _b.startDevice)
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
    }
    reportToServer(command, data, successcb, failcb) {
        let url = this.props.server.url;
        (0, node_fetch_1.default)(`${url}/${command}`, {
            headers: [
                ["Content-Type", "application/json"],
                ["shome_organizationid", this.props.server.shome_organizationid],
                ["shome_authtoken", this.props.server.shome_authtoken],
            ],
            method: "POST",
            redirect: "follow",
            body: JSON.stringify(data)
        }).then((res) => __awaiter(this, void 0, void 0, function* () {
            //success async
            //console.log(res);
            if (res.ok)
                return res.json();
            const bodyText = yield res.text();
            return Promise.reject(new error_1.default("report:fetcherror", `status='${res.status}', statusText='${res.statusText}'; body='${bodyText}'`));
        })).then(data => {
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
            console.log(`${colours_1.default.fg.green}Success ${device.id}; data='${JSON.stringify(data)}'${colours_1.default.reset}`);
            device.createReportTimer();
        }, (res) => {
            console.log(`${colours_1.default.fg.red}FAIL ${device.id}; res='${res}'${colours_1.default.reset}`);
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
