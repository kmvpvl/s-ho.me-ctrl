import EventEmitter from "node:events";
import SHOMEError from "./error";

export default class DeviceProto {
    private eventEmitter: EventEmitter;
    protected name: string;
    protected pin: number;
    protected value?: number;
    protected msFreqRead: number;
    protected msFreqReport: number;
    protected lastTimeValueExch?: Date;
    protected timerID?: number;
    public constructor(name: string, pin: number, msFreqReport: number, msFreqRead?:number) {
        this.name = name;
        this.pin = pin;
        this.msFreqReport = msFreqReport;
        this.msFreqRead = msFreqRead?msFreqRead:msFreqReport;

        this.initPin();
        this.eventEmitter = new EventEmitter();
    }
    
    protected initPin(){
        throw new SHOMEError("abstract:notimplemented", `initPin function`);
    }

    protected draftRead(): number {
        throw new SHOMEError("abstract:notimplemented", `draftRead function`);
    }

}