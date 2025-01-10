const sbClient = (connectionString) => {
    const getPropertyValue = (sourceText) =>
        sourceText.substring(sourceText.indexOf("=") + 1);

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

    const getToken = async () => {
        let date = new Date();
        date.setHours(date.getHours() + 1);

        const epochTime = Math.floor(date.valueOf() / 1000);

        const token = await getHmac256Digest(sharedAccessKey, `${uri}\n${epochTime}`);

        return `SharedAccessSignature sr=${uri}&sig=${encodeURIComponent(token)}&se=${epochTime}&skn=${sharedAccessKeyName}`;
    };

    const postMessage = async (message, queueName, contentType, customHeaders) => {
        if (typeof message !== 'string') {
            throw Error('Message must be a string');
        }

        if (typeof contentType !== 'string' || (contentType ?? '') == '') {
            throw Error('Content type must be informed. See const FILE_CONTENT');
        }

        const token = await getToken();

        let headers = {
            'Content-Type': contentType,
            'Authorization': token,
            'Host': uri
        };

        if (typeof customHeaders == 'object') {
            for (let key of customHeaders) {
                headers[key] = customHeaders[key];
            }
        }

        const response = await fetch(`https://${uri}/${queueName}/messages`, {
            headers: new Headers(headers),
            method: 'POST',
            body: message
        });

        const isSuccess = response.status === 201;

        return {
            isSuccess,
            status: response.status,
            response
        };
    };

    const getMessage = async (queueName, subscription, token) => {
        const messageToken = token || await getToken();

        var response = await fetch(
            `https://${uri}/${queueName}/subscriptions/${subscription}/messages/head?timeout=60`,
            {
                headers: new Headers({
                    'Authorization': messageToken,
                    'Host': uri,
                    'Content-Length': 0
                }),
                method: 'DELETE'
            }
        );

        return {
            status: response.status,
            isEmpty: response.status == 204,
            isError: !response.ok,
            message: await response.text(),
            headers: Array.from(response.headers.entries()).map(x => {
                return {
                    key: x[0],
                    value: x[1]
                };
            }),
            id: crypto.randomUUID()
        };
    };

    const waitEmptyQueue = () =>
        new Promise(r => setTimeout(r, 200));

    const consumeMessages = async (queueName, handleMessage, shouldContinue, subscription = 'default') => {
        if (!handleMessage || typeof handleMessage !== 'function') {
            throw new Error('Callback must be a function');
        }

        var token = await getToken();

        let brokeredMessages = [];

        while (shouldContinue === undefined || shouldContinue()) {
            const message = await getMessage(queueName, subscription, token);

            if (message.isError) {
                continue;
            }

            if (message.isEmpty) {
                await waitEmptyQueue();

                continue;
            }

            await handleMessage(message);
            brokeredMessages.push(message.id);
        }
    };

    const CONTENT_TYPE = {
        JSON: 'application/json;charset=utf-8',
        XML: 'text/xml;charset=utf-8'
    };

    const connectionStringParts = connectionString.split(';');
    const endpoint = getPropertyValue(connectionStringParts[0]);
    const uri = (new URL(endpoint)).hostname;
    const sharedAccessKeyName = getPropertyValue(connectionStringParts[1]);
    const sharedAccessKey = getPropertyValue(connectionStringParts[2]);

    return {
        endpoint,
        uri,
        sharedAccessKey,
        sharedAccessKeyName,
        postMessage,
        consumeMessages,
        CONTENT_TYPE
    };
};

module.exports = sbClient;