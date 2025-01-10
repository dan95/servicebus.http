const appSettings = require('./appsettings.json');
const sbClient = require('./servicebus-client.js');

let client = sbClient(appSettings.ConnectionStrings.ServiceBus);
const maxCount = 10;
let currentDelivery = 0;

const queueName = "YOUR-SERVICE-BUS-QUEUE";

client.consumeMessages(
    queueName,
    async (message) => {
        console.log(JSON.stringify(message));

        currentDelivery++;
    },
    () => true
);