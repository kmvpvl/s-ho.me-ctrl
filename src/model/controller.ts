import DeviceProto, { DeviceDataToReport, DeviceProps } from "./deviceproto";
import { DHT22Hum, DHT22Temp } from "./dht";
import SHOMEError from "./error";
import { PIRMotion } from "./motionsensor";
import rpio from "rpio";

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
    }
    
    public reportToServer(device: DeviceProto){
        let rd: DataToReport = {
            timestamp: new Date(),
            devices: []
        };
        rd.devices.push(device.prepareDataToReport()); 
        fetch(`${this.props.server.url}/`, {
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
            if (res.ok) return res.json();
            console.log(`FAIL ${device.id}; res='${res.status}'`);
            return Promise.reject(res);
        }).then( data => {
            //success data analyzing
            console.log(`Success ${device.id}; data='${JSON.stringify(data)}'`);
        }).catch (reason => {
            console.log(`CATCH ${device.id}; ${reason}`);
        })
    }

    public reportToTG(){

    }
}