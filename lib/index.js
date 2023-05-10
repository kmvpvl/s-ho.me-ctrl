"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_dht_sensor_1 = __importDefault(require("node-dht-sensor"));
setInterval(() => {
    const data = node_dht_sensor_1.default.read(22, 4);
    console.log(`temp=${data.temperature}; hum=${data.humidity}`);
}, 30000);
