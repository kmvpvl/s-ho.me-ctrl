import DeviceProto, { DeviceDataToReport, DeviceProps } from "./deviceproto";
import { DHT22Hum, DHT22Temp } from "./dht";
import SHOMEError from "./error";
import { PIRMotion } from "./motionsensor";
import rpio from "rpio";
import fetch from 'node-fetch';
import { Telegram, Telegraf, TelegramError, Context } from "telegraf";

export type ControllerMode = {
    name: string;
    controller?: string;
    devices?: string;
    server?: string
}
export type ControllerProps = {
    mode?: string;
    modes?: Array<ControllerMode>;
    devices: Array<DeviceProps>;
    controller: {
        name: string; 
        description: string; 
        autoupdate: {
            auto: boolean;
            repo?: string;
            branch?: string;
        },
        location?: object;
        buffer?: object;
        logs?: {}
    };
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
    }
}
export type DataToReport = {
    timestamp: Date;
    devices: Array<DeviceDataToReport>;
}

export default class Controller {
    protected props: ControllerProps;
    protected devs: Array<DeviceProto>;
    protected tgBot?: Telegraf;
    constructor(props: ControllerProps) {
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
        for (const [i, device] of Object.entries(props.devices)){
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
            })
        }
        this.reportToServer("initcontroller", this.props.controller, (data)=>console.log(JSON.stringify(data)), (res)=>console.log(JSON.stringify(res)));
        if (this.props.notifications?.startController) this.notify( `has started successfully`);
        console.log(`Controller '${this.props.controller.name}' has started successfully`);
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
        }).then(res => {
            //success async
            //console.log(res);
            if (res.ok) return res.json();
            //failcb(res);
            return Promise.reject(new SHOMEError("report:fetcherror", `status='${res.status}', statusText='${res.statusText}'`));
        }).then( data => {
            //success data analyzing
            successcb(data);
        }).catch (err => {
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
            console.log(`Success ${device.id}; data='${JSON.stringify(data)}'`);
            device.createReportTimer();
        }, (res)=>{
            console.log(`FAIL ${device.id}; res='${res.status}'`);
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