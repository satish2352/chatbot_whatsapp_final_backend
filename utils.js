require('dotenv').config()
const { default: makeWASocket, DisconnectReason } = require("@whiskeysockets/baileys");
const { MongoClient } = require("mongodb");
const useMongoDBAuthState = require('./mongoAuthState')

async function connectDB(){
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
    const db = mongoClient
        .db("test")
    return db
}

async function connectToWhatsApp(ws) {
    const db = await connectDB()

    const { state, saveCreds, removeData } = await useMongoDBAuthState(db.collection("auth_info_baileys"))
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    })
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update

        if (update.qr) {
            ws.send("qr:" + update.qr)
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            console.log('reconnecting ', shouldReconnect)

            if (shouldReconnect) {
                connectToWhatsApp(ws)
            }else{
                removeData(state.creds._id)
                connectToWhatsApp(ws)
            }
        } else if (connection === 'open') {
            ws.send("Connection Made")
            console.log("State", state.creds.me.id)
        } else if (connection == "connecting") {
            ws.send("Connecting...")
        }
    })
    // sock.ev.on('messages.upsert', m => {
    //     console.log(m.messages)

    //     // console.log('replying to', m.messages[0].key.remoteJid)
    //     // await sock.sendMessage(m.messages[0].key.remoteJid!, { text: 'Hello there!' })
    // })
    sock.ev.on('creds.update', saveCreds)
}

async function saveFlow({author, name, nodes, edges, data}){
    const db = await connectDB()
    const collection = db.collection('flows')
    const flow = await collection.findOneAndUpdate({author}, {$set:{author, name, nodes, edges, data}}, {upsert:true})
    return flow._id
}

module.exports = {connectToWhatsApp, saveFlow}

