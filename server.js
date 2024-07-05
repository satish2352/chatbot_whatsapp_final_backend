const { connectToWhatsApp, saveFlow, getFlow } = require('./utils');
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 3001 });

wss.on('connection', function (ws) {
    const saveFlowRegex = new RegExp(/^\/saveFlow\/*/); // Regular expression for "/saveFlow/"
    const getFlowRegex = new RegExp(/^\/getFlow\/*/);   // Regular expression for "/getFlow/"

    ws.on('message', async function (message) {
        const msg = message.toString();

        if (msg === "/connect") {
            await connectToWhatsApp(ws);
        } else if (msg.match(saveFlowRegex)) {
            const data = JSON.parse(msg.slice(10)); // Extract JSON data after "/saveFlow/"
            const id = await saveFlow(data);
            ws.send(`Updated Successfully ${id}`);
        } else if (msg.match(getFlowRegex)) {
            const id = msg.slice(9); // Extract ID from "/getFlow/"
            const flow = await getFlow({ id });
            ws.send(`flow:${JSON.stringify(flow)}`);
        }
    });
});
