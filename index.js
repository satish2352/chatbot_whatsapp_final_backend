require('dotenv').config()
const { default: makeWASocket, DisconnectReason } = require("@whiskeysockets/baileys");
const { MongoClient } = require("mongodb");
const useMongoDBAuthState = require('./mongoAuthState')

let sock;

module.exports = async function connectToWhatsApp(ws) {
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
    const collection = mongoClient
        .db("test")
        .collection("auth_info_baileys");

    const { state, saveCreds, removeData } = await useMongoDBAuthState(collection)
    sock = makeWASocket({
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

            console.log("State Cred",state.creds)
            if (shouldReconnect) {
                connectToWhatsApp(ws)
            }else{
                removeData(state.creds._id)
                connectToWhatsApp(ws)
            }
        } else if (connection === 'open') {
            ws.send("Connection Made")
        } else if (connection == "connecting") {
            ws.send("Connecting...")
        }
    })
    sock.ev.on('messages.upsert', m => {
        console.log(m.messages)

        // console.log('replying to', m.messages[0].key.remoteJid)
        // await sock.sendMessage(m.messages[0].key.remoteJid!, { text: 'Hello there!' })
    })
    sock.ev.on('creds.update', saveCreds)
    console.log("Trying", sock.authState.creds.registered)
}



