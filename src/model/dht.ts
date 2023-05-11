import { randomInt } from "crypto";
import DeviceProto from "./deviceproto";
import dht from 'node-dht-sensor';

export class DHT22Temp extends DeviceProto {
    protected async initPin(): Promise<void> {
        
    }
    protected async draftRead(): Promise<number> {
        let data: dht.SensorData;
        if (!this.props.emulation) {
            data = dht.read(22, 4);
        } else {
            data = {
                temperature: this._value!==undefined?this._value + randomInt(-1, 2)/10.0:randomInt(-29, 30),
                humidity: NaN
            }
        }
        console.log(`Draft read device id='${this.props.id}'; temp=${data.temperature}`);

        return this.props.precision?DeviceProto.setPrecision(data.temperature, this.props.precision):data.temperature;
    }
}