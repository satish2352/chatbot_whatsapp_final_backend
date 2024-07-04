const { connectToWhatsApp, saveFlow } = require('./utils')
const server = require('ws').Server
const s =new server({port:3001})


s.on('connection', function(ws){
    const saveFlow = new RegExp('/saveFlow/*')
    ws.on('message', async function(message){
        const msg = message.toString()
        // console.log(msg)
        if(msg=="/connect"){
            await connectToWhatsApp(ws)
            // ws.send("Connection Made")
        }
        if(msg.match(saveFlow)[0] == "/saveFlow/"){
            const data = JSON.parse(msg.slice(10))
            console.log(data.nodes)
            // const id = await saveFlow({author:"something2", name:"Krish", nodes:['somehit'], edges:["something"], data:[{"key":"value"}, {"key":"value"}]})
            // // ws.send("Connection Made")
            // ws.send(`Created Successfully ${id}`)
        }
    })
})