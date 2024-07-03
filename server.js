const server = require('ws').Server
const s =new server({port:3001})
const connectToWhatsApp = require('./index.js')


s.on('connection', function(ws){
    ws.on('message', async function(message){
        console.log("Something")
        if(message.slice()=="/connect"){
            await connectToWhatsApp(ws)
            // ws.send("Connection Made")
        }
    })
})