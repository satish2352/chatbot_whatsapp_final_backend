require('dotenv').config();
const { default: makeWASocket, DisconnectReason } = require("@whiskeysockets/baileys");
const { MongoClient, ObjectId } = require("mongodb");
const useMongoDBAuthState = require('./mongoAuthState');

async function connectDB(collectionName) {
    const mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
    const collection = mongoClient.db("test").collection(collectionName);
    return collection;
}

async function connectToWhatsApp(ws) {
    const collection = await connectDB("auth_info_baileys");
    const { state, saveCreds, removeData } = await useMongoDBAuthState(collection);
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (update.qr) {
            ws.send("qr:" + update.qr);
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                connectToWhatsApp(ws);
            } else {
                removeData(state.creds._id);
                connectToWhatsApp(ws);
            }
        } else if (connection === 'open') {
            const id = await getIdByAuthor(state.creds.me.id);
            ws.send("id:" + id);
        } else if (connection === 'connecting') {
            ws.send("Connecting...");
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

async function saveFlow({id, author, name, nodes, edges, data }) {
    const collection = await connectDB("flows");
    const flow = await collection.findOneAndUpdate(
        { _id:id },
        { $set: { author, name, nodes, edges, data } },
        { upsert: true }
    );
    return flow._id;
}

async function getFlow({ id }) {
    const collection = await connectDB("flows");
    return await collection.findOne({ _id: ObjectId.createFromHexString(id) });
}

async function getIdByAuthor(author) {
    const collection = await connectDB("flows");
    const flow = await collection.findOne({ author });
    return flow._id;
}

module.exports = { connectToWhatsApp, saveFlow, getFlow };
