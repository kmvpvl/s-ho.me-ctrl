import DeviceProto, { DeviceDataToReport, DeviceProps } from "./deviceproto";
import { DHT22Hum, DHT22Temp } from "./dht";
import SHOMEError from "./error";
import { PIRMotion } from "./motionsensor";
import rpio from "rpio";
import fetch from 'node-fetch';

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
    notifications: {
        auth_TG?: string;
        on: boolean;
        start?: boolean;
        altURLToggle?: boolean;
        lostServer?: boolean;
        unknownHardware?: boolean;
    };
    server: {
        url: string;
        alt_url?: string;
        auth_SHOME: string;
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
    constructor(props: ControllerProps) {
        this.props = props;
        this.devs = [];
        console.log(`Controller '${this.props.controller.name}' is starting...`);
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
                default: throw new SHOMEError("hardware:unknowndevice", JSON.stringify(device))
            }
            this.devs.push(d);
            let c = this;
            d.on('change', (device)=>{
                console.log(`Value changed event device.id='${device.id}', value='${device.value}'`);
            });
            d.on('report', (device)=>{
                console.log(`Device report: id='${device.id}', value='${device.value}'`);
                c.reportToServer(device);
            })
        }
        console.log(`Controller '${this.props.controller.name}' is started successfully`);
        this.report("initcontroller", this.props, (data)=>console.log(JSON.stringify(data)), (res)=>console.log(JSON.stringify(res)));
    }

    protected report(command: string, data: any, successcb: (data: any)=>void, failcb: (res: any)=>void) {
        fetch(`${this.props.server.url}/${command}`, {
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
            if (res.ok) return res.json();
            //failcb(res);
            return Promise.reject(res);
        }).then( data => {
            //success data analyzing
            successcb(data);
        }).catch (reason => {
            failcb(reason);
        })
    }
    
    public reportToServer(device: DeviceProto){
        let rd: DataToReport = {
            timestamp: new Date(),
            devices: []
        };
        rd.devices.push(device.prepareDataToReport());
        this.report("devicereport", rd, (data)=>{
            console.log(`Success ${device.id}; data='${JSON.stringify(data)}'`);
            device.createReportTimer();
        }, (res)=>{
            console.log(`FAIL ${device.id}; res='${res.status}'`);
        }); 
    }

    public reportToTG(){

    }
}