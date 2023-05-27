import Controller, { ControllerProps, TSettings } from './model/controller';
import fs from 'fs';

let settings: TSettings;
const removeJSONComments = (json: string) => {
    return json.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? "" : m);
}

try {
    let strSettings = fs.readFileSync("settings.json", "utf-8");
    settings =  JSON.parse(removeJSONComments(strSettings));
    require('log-timestamp')(settings.controller.name);
    const controller = new Controller(settings);
} catch (err: any) {
    console.error(`Controller not started - ${err.message}`);
}
