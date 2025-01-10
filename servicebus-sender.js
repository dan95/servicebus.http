const appSettings = require('./appsettings.json');
const sbClient = require('./servicebus-client');

const client = sbClient(appSettings.ConnectionStrings.ServiceBus);

const fileContent = JSON.stringify({
    "id": 312312,
    "someProperty": "PROPERTY VALUE"
});

const queueName = "YOUR-SERVICE-BUS-QUEUE";

client.postMessage(fileContent, queueName, client.CONTENT_TYPE.JSON, {
    'CUSTOM FILTER 1': 'CUSTOME FILTER 1 VALUE',
    'CUSTOM FILTER 2': 'CUSTOME FILTER 2 VALUE'
})
.then(response => {
    console.log(response);
});