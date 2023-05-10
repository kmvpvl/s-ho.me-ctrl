import dht from 'node-dht-sensor';
setInterval(()=> {
    const data = dht.read(22, 4);
    console.log(`temp=${data.temperature}; hum=${data.humidity}`);
}, 30000);