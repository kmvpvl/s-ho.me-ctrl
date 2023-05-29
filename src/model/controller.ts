import DeviceProto, { DeviceDataToReport, DeviceProps } from "./deviceproto";
import { DHT22Hum, DHT22Temp } from "./dht";
import SHOMEError from "./error";
import { PIRMotion } from "./motionsensor";
import rpio from "rpio";
import fetch from 'node-fetch';
import { Telegram, Telegraf, TelegramError, Context } from "telegraf";
import colors from './colours';

export type ControllerMode = {
    name: string;
    controller?: string;
    devices?: string;
    server?: string
}
export type ControllerProps = {
    name: string; 
    description: string; 
    autoupdate: {
        auto: boolean;
        repo?: string;
        branch?: string;
    },
    location?: object;
    buffer?: {
        
    };
    logs?: object;
    layers?: [{
        sortNumber: number;
        bgImage?: string;
        id: string;
        name: string;
    }];
    rules?:[]
}

export type TSettings = {
    mode?: string;
    modes?: Array<ControllerMode>;
    devices: Array<DeviceProps>;
    controller: ControllerProps;
    notifications?: {
        tgToken?: string;
        tgUsers?: Array<string | number>;
        on?: boolean;
        startController?: boolean;
        startDevice?: boolean;
        altURLToggle?: boolean;
        reportToServerFailed?: boolean;
        unknownHardware?: boolean;
    };
    server: {
        url: string;
        alt_url?: string;
        shome_organizationid: string;
        shome_authtoken: string;
        attemptsBeforeAltURL?: number;
        startOffline?: boolean;
    }
}
export type DataToReport = {
    timestamp: Date;
    devices: Array<DeviceDataToReport>;
}

export default class Controller {
    protected props: TSettings;
    protected devs: Array<DeviceProto>;
    protected tgBot?: Telegraf;
    constructor(props: TSettings) {
        this.props = props;
        if (this.props.notifications) {
            const tgToken = this.props.notifications.tgToken?this.props.notifications.tgToken:process.env.tgToken;
            if (tgToken) {
                this.tgBot = new Telegraf<Context>(tgToken);
            }
        }
        this.devs = [];
        console.log(`Controller '${this.props.controller.name}' is starting...`);
        if (this.props.notifications?.startController) this.notify(`is starting...`);
        rpio.init({mapping: 'gpio'});

        this.reportToServer("initcontroller", this.props.controller, 
        (data)=>{
            //getting actual controller settings
            console.log(`${colors.fg.green}Gotten controller settings from server='${JSON.stringify(data)}'${colors.reset}`);
            // let me transfer properties from gotten structure to controller props
            for (let prop in data) {
                (this.props.controller as any)[prop] = data[prop];
            }
            this.initDevices();
            console.log(`${colors.fg.green}Controller '${this.props.controller.name}' has started successfully${colors.reset}`);
            if (this.props.notifications?.startController) this.notify( `has started successfully`);
        }, 
        (res)=>{
            // error getting actual controller settings
            console.log(`${colors.fg.red}Error reading settings of controller from server='${JSON.stringify(res)}'${colors.reset}`);
            // let's start without server and collect values
            console.log(`${colors.fg.yellow}Controller '${this.props.controller.name}' has started alone${colors.reset}`);
            if (this.props.server.startOffline) {
                if (this.props.notifications?.startController) this.notify( `has started alone`);

                this.initDevices();
            } else {
                throw new SHOMEError("start:restart", `Couldnot start controller`);
                //process.exit(1);
            }
        });
    }
    protected initDevices() {
        this.props.devices.forEach((device)=>device.organizationid = this.props.server.shome_organizationid);
        this.reportToServer("initdevices", this.props.devices, (data)=>{
            //getting actual devices settings
            console.log(`${colors.fg.green}Gotten devices settings from server='${JSON.stringify(data)}'${colors.reset}`);
            this.activateDevices();
        }, 
        (res)=>{
            // error getting actual devices settings
            console.log(`${colors.fg.red}Error reading settings of devices from server='${JSON.stringify(res)}'${colors.reset}`);
            if (this.props.server.startOffline) {
                this.activateDevices();
            } else {
                throw new SHOMEError("start:restart", `Couldnot start devices`);
                //process.exit(1);
            }
        });
    }

    protected activateDevices() {
        for (let i in this.props.devices){
            const device = this.props.devices[i];
            console.log(`${i}: Checking device id='${device.id}'; name='${device.name}'`);
            let d: DeviceProto;
            switch(`${device.hardware}:${device.type}`) {
                case 'DHT22:Temp':
                    d = new DHT22Temp(device);
                    break;
                case 'DHT22:Hum':
                    d = new DHT22Hum(device);
                    break;
                case 'PIR:Motion':
                    d = new PIRMotion(device);
                    break;
                default: 
                    if (this.props.notifications?.unknownHardware) this.notify(`Unknown device found. Hardware='${device.hardware}'; type='${device.type}'`);
                    throw new SHOMEError("hardware:unknowndevice", JSON.stringify(device))
            }
            this.devs.push(d);
            if (this.props.notifications?.startDevice) this.notify(`Device started. Device='${device.name}'`);
            let c = this;
            d.on('change', (device)=>{
                console.log(`Value changed event device.id='${device.id}', value='${device.value}'`);
            });
            d.on('report', (device)=>{
                console.log(`Device report: id='${device.id}', value='${device.value}'`);
                c.reportDevice(device);
            });
        }
}

    protected reportToServer(command: string, data: any, successcb: (data: any)=>void, failcb: (res: any)=>void) {
        let url = this.props.server.url; 
        fetch(`${url}/${command}`, {
            headers: [
                ["Content-Type", "application/json"],
                ["shome_organizationid", this.props.server.shome_organizationid],
                ["shome_authtoken", this.props.server.shome_authtoken],
            ],
            method: "POST",
            redirect: "follow",
            body: JSON.stringify(data)
        }).then(async res => {
            //success async
            //console.log(res);
            if (res.ok) return res.json();
            const bodyText = await res.text();
            return Promise.reject(new SHOMEError("report:fetcherror", `status='${res.status}', statusText='${res.statusText}'; body='${bodyText}'`));
        }).then( data => {
            //success data analyzing
            successcb(data);
        }).catch ( err => {
            console.log(`Fetch error: message='${err.message}', server_url='${url}', command='${command}', data='${JSON.stringify(data)}'`);
            failcb(err);
            if (this.props.notifications?.reportToServerFailed) this.notify(`reportToServerFailed: command='${command}', data='${JSON.stringify(data)}'; Fetch error: message='${err.message}', server_url='${url}'`);
        })
    }
    
    public reportDevice(device: DeviceProto){
        let rd: DataToReport = {
            timestamp: new Date(),
            devices: []
        };
        rd.devices.push(device.prepareDataToReport());
        this.reportToServer("devicereport", rd, (data)=>{
            console.log(`${colors.fg.green}Success ${device.id}; data='${JSON.stringify(data)}'${colors.reset}`);
            device.createReportTimer();
        }, (res)=>{
            console.log(`${colors.fg.red}FAIL ${device.id}; res='${res}'${colors.reset}`);
        }); 
    }

    public notify(message: string){
        if (!this.props.notifications?.on) return;
        if (this.props.notifications?.tgUsers){
            for (const v of this.props?.notifications?.tgUsers?.values())
            this.tgBot?.telegram.sendMessage(v, `Controller='${this.props.controller.name}'; ${message}`);
        }
    }
}