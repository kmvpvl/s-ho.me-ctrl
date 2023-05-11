import { randomInt } from "crypto";
import DeviceProto from "./deviceproto";
import {promise as gpio} from 'rpi-gpio';

export class PIRMotion extends DeviceProto {
    protected async initPin(): Promise<void> {
        await gpio.setup(this.props.pin, gpio.DIR_IN);
    }
    protected async draftRead(): Promise<number> {
        let data;
        if (!this.props.emulation) {
            const d = await gpio.read(this.props.pin);
            data = d?1:0;
        } else {
            data = randomInt(0, 2);
        }
        console.log(`Draft read device id='${this.props.id}'; on=${data}`);

        return this.props.precision?DeviceProto.setPrecision(data, this.props.precision):data;
    }
}