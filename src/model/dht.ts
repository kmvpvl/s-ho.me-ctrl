import { randomInt } from "crypto";
import DeviceProto from "./deviceproto";
import dht from 'node-dht-sensor';

export class DHT22Temp extends DeviceProto {
    protected initPin(): void {
        
    }
    protected draftRead(): number {
        let data: dht.SensorData;
        if (!this.props.emulation) {
            data = dht.read(22, 4);
        } else {
            data = {
                temperature: this._value!==undefined?this._value + randomInt(-1, 2)/10.0:randomInt(-29, 30),
                humidity: NaN
            }
        }
        return data.temperature;
    }
}
export class DHT22Hum extends DeviceProto {
    protected initPin(): void {
        
    }
    protected draftRead(): number {
        let data: dht.SensorData;
        if (!this.props.emulation) {
            data = dht.read(22, 4);
        } else {
            data = {
                temperature: this._value!==undefined?this._value + randomInt(-1, 2)/10.0:randomInt(-29, 30),
                humidity: this._value!==undefined?this._value + randomInt(0, 3)/10.0:randomInt(0, 50)
            }
        }
        return data.humidity;
    }
}