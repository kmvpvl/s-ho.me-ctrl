import EventEmitter from "events";
import SHOMEError from "./error";

export type DeviceType = "Temp" | "Hum" | "Relay" | "Motion";
export type HardwareType = "DHT22" | "BPM180" | "RELAYNO" | "RELAYNC" | "PIR";

export type DeviceProps = {
    organizationid?: string;
    id: string;
    name: string;
    type: DeviceType;
    units?: string;
    hardware: HardwareType;
    emulation?: boolean;
    pin: number;
    freqRead: number;
    freqReport: number;
    threshold?: number;
    precision?: number;
    reportOnValueChanged: boolean;
    reportOnInit?: boolean;
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
export type DeviceDataToReport = {
    id: string;
    value: number;
    desc?: string;
    extra?: object;
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
        this.createReportTimer();
        console.log(`Device ${props.id} (${props.name}: type=${props.type}, hw=${props.hardware}, pin=${props.pin}) has just initialized. Emulation='${props.emulation}'`);
    }

    public createReadTimer() {
        if (this.readTimerID !== undefined) clearTimeout(this.readTimerID);
        this.readTimerID = setTimeout((device)=>{
            device.updateValue();
            device.createReadTimer();
        }, this.props.freqRead * 1000, this);
    }
    
    public createReportTimer() {
        if (this.reportTimerID !== undefined) clearTimeout(this.reportTimerID);
        this.reportTimerID = setTimeout((device)=>{
            device.timeToReport();
            device.createReportTimer();
        }, this.props.freqReport * 1000, this);
    }

    protected initPin(): void{
        throw new SHOMEError("abstract:notimplemented", `initPin function`);
    }

    protected draftRead(): number {
        this.initPin();
        throw new SHOMEError("abstract:notimplemented", `draftRead function`);
    }

    static setPrecision(n: number, precision: number): number {
        return parseFloat(n.toFixed(precision));
    } 

    public updateValue(): void {
        const dvalue = this.draftRead();
        if ((this.value!==undefined && !this.props.threshold && !Math.abs(this.value - dvalue)) 
        || (this.value!==undefined && this.props.threshold && Math.abs(this.value - dvalue) < this.props.threshold)) {
            // value not changed or change in the range of threshold, do nothing
        } else {
            const repOnInit = this.props.reportOnInit && this._value === undefined && dvalue !== undefined;
            this._value = dvalue;
            this.eventEmitter.emit('change', this);
            if (this.props.reportOnValueChanged || repOnInit) this.timeToReport();
        }
    }

    public timeToReport(){
        this.eventEmitter.emit('report', this);
    }

    public on(event: string, callback: (d: DeviceProto)=>void) {
        this.eventEmitter.on(event, callback);
    }
    public get value(): number | undefined {
        return this.props.precision!==undefined && this._value!==undefined?DeviceProto.setPrecision(this._value, this.props.precision):this._value;
    }

    public get strValue(): string | undefined {
        return `${this.value}${this.props.units?this.props.units:''}`;
    }

    public get id(): string {
        return this.props.id;
    }

    public prepareDataToReport(): DeviceDataToReport {
        if (undefined === this.value) throw new SHOMEError("report:deviceisnotreadytoreport", `device_id='${this.id}'`);
        return {
            id: this.id,
            value: this.value,
            desc: this.strValue
        };
    }

    public processResponceOfReport () {

    }
}