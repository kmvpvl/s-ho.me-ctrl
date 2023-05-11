import EventEmitter from "events";
import SHOMEError from "./error";

export type DeviceType = "Temp" | "Hum" | "Relay" | "Motion";
export type HardwareType = "DHT22" | "BPM180" | "RELAYNO" | "RELAYNC" | "PIR";

export type DeviceProps = {
    id: string;
    name: string;
    type: DeviceType;
    hardware: HardwareType;
    emulation?: boolean;
    pin: number;
    freqRead: number;
    freqReport: number;
    threshold?: number;
    precision?: number;
    reportOnValueChanged: boolean;
    location: {
        layer: string;
        x?: number;
        y?: number;
    };
    ranges: Array<{
        name: string;
        color: string;
        max?: number;
        min?: number;
    }>
}

export default class DeviceProto {
    private eventEmitter: EventEmitter;
    protected props: DeviceProps;
    protected readTimerID?: NodeJS.Timeout;
    protected reportTimerID?: NodeJS.Timeout;
    protected _value?: number;
    public constructor(props: DeviceProps) {
        this.props = props;
        this.eventEmitter = new EventEmitter();
        this.createReadTimer();
        console.log(`Device ${props.id} (${props.name}: type=${props.type}, hw=${props.hardware}, pin=${props.pin}) has just initialized. Emulation='${props.emulation}'`);
    }

    public createReadTimer() {
        this.readTimerID = setTimeout((device)=>{
            device.updateValue();
            device.createReadTimer();
        }, this.props.freqRead * 1000, this);
    }
    
    protected async initPin(): Promise<void>{
        throw new SHOMEError("abstract:notimplemented", `initPin function`);
    }

    protected async draftRead(): Promise<number> {
        await this.initPin();
        throw new SHOMEError("abstract:notimplemented", `draftRead function`);
    }

    static setPrecision(n: number, precision: number): number {
        return parseFloat(n.toFixed(precision));
    } 

    public async updateValue(): Promise<void> {
        const dvalue = await this.draftRead();
        if ((this._value!==undefined && !this.props.threshold && !Math.abs(this._value - dvalue)) 
        || (this._value!==undefined && this.props.threshold && Math.abs(this._value - dvalue) < this.props.threshold)) {
            // value not changed or change in range of threshold, do nothing
        } else {
            this._value = dvalue;
            this.eventEmitter.emit('value_changed', this);
        }
    }

    public on(event: string, callback: (d: DeviceProto)=>void) {
        this.eventEmitter.on(event, callback);
    }
    public get value(): number | undefined {
        return this._value;
    }

    public get id(): string {
        return this.props.id;
    }
}