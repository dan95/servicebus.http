# servicebus.http
This small project is intended to exemplify the process of connecting to service bus via HTTP requests and sending/consuming messages.

By using the [servicebus-client](./servicebus-client.js) object, you can send and receive messages through HTTP with ServiceBus.
The main intention here is being able to send and receive messages from Azure ServiceBus without the need for any additional package or [SDK](https://github.com/Azure/azure-sdk-for-js).

## Connection String
The file [appsettings.json](./appsettings.json) is supposed to receive the raw connection string you can copy from your Azure Account in the Azure Portal ServiceBus section.

## servicebus-client.js

This file works as a wrapper for the HTTP calls.
It is also responsible for generating the [SAS token](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-sas) necessary to perform actions onto your ServiceBus queues/topics.

### HMAC256

In [servicebus-client.js](./servicebus-client.js), we have this method that is responsible for the boring part which is generating the HMAC256 digest:

```js
//It receives the secret and the value to be digested
//Value pattern: uri + \n + epochTime
const getHmac256Digest = async (secret, value) => {
        const encoder = new TextEncoder();

        const algorithm = {
            name: 'HMAC',
            hash: 'SHA-256'
        };

        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            algorithm,
            false,
            ['sign', 'verify']
        );

        const signature = await crypto.subtle.sign(
            algorithm.name,
            key,
            encoder.encode(value));

        return Buffer.from(new Uint8Array(signature)).toString('base64');
    };
```

## servicebus.receiver.js

This file is an example on how to receive messages. Please note that this way of receiving messages is not optimal and should only be used as a straightforward workaround.

## servicebus.sender.js

This file is an example on how to send messages.
It also contains an example on how to configure custom filters on the message (the object will be later translated into common HTTP headers).