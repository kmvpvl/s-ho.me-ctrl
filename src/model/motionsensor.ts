import { randomInt } from "crypto";
import DeviceProto from "./deviceproto";
//import {promise as gpio} from 'rpi-gpio';
import rpio from "rpio";


export class PIRMotion extends DeviceProto {
    protected initPin(): void {
        rpio.open(this.props.pin, rpio.INPUT);
    }
    protected draftRead(): number {
        let data;
        if (!this.props.emulation) {
            const d = rpio.read(this.props.pin);
            data = d?1:0;
        } else {
            data = randomInt(0, 2);
        }
        console.log(`Draft read device id='${this.props.id}'; on=${data}`);

        return this.props.precision?DeviceProto.setPrecision(data, this.props.precision):data;
    }
}