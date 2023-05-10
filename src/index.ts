import dht from 'node-dht-sensor';
const data = dht.read(22, 4);
console.log(`temp=${data.temperature}; hum=${data.humidity}`);