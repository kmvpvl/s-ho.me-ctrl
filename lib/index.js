"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = __importDefault(require("./model/controller"));
const fs_1 = __importDefault(require("fs"));
let settings;
const removeJSONComments = (json) => {
    return json.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
};
try {
    let strSettings = fs_1.default.readFileSync("settings.json", "utf-8");
    settings = JSON.parse(removeJSONComments(strSettings));
    require('log-timestamp')(settings.controller.name);
    const controller = new controller_1.default(settings);
}
catch (err) {
    console.error(`Controller not started - ${err.message}`);
}
