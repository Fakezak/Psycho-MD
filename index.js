const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const chalk = require('chalk');
const config = require("./config");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
            console.log(chalk.blueBright(`\n[✅] ${config.botName} is now online!`));

            if (!fs.existsSync('owner.json')) {
                fs.writeFileSync('owner.json', JSON.stringify({ owner: config.ownerNumber }));
            }

            let { owner } = JSON.parse(fs.readFileSync('owner.json'));
            if (owner) {
                await sock.sendMessage(owner + '@s.whatsapp.net', { text: `Welcome to ${config.botName}! 🚀` });
            }
        }

        if (connection === 'close') {
            console.log(chalk.redBright('\n[❌] Bot is offline. Restarting...'));
            if (lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                startBot();
            } else {
                console.log(chalk.redBright('Login expired. Restart and re-authenticate.'));
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
        let msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        let sender = msg.key.remoteJid;
        let messageText = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        
        if (config.autoRead) {
            await sock.readMessages([msg.key]);
        }

        console.log(chalk.green(`📩 Message from ${sender}: ${messageText}`));

        if (messageText.startsWith(config.prefix + "menu")) {
            let menuText = `*📜 ${config.botName} Commands 📜*\n\n
                *${config.prefix}ping* - Check bot response\n
                *${config.prefix}info* - Bot details\n
                *${config.prefix}sticker* - Convert image to sticker\n
                *${config.prefix}ytmp3 [link]* - Download YouTube audio\n
                *${config.prefix}weather [city]* - Get weather info\n
                *${config.prefix}news* - Latest news\n
                *${config.prefix}joke* - Get a random joke\n
                *${config.prefix}quote* - Get an inspirational quote\n
                *${config.prefix}define [word]* - Get word definition\n\n
                More commands coming soon! 🚀`;
            
            await sock.sendMessage(sender, { text: menuText });
        }

        if (messageText.startsWith(config.prefix + "ping")) {
            await sock.sendMessage(sender, { text: "Pong! 🏓" });
        }

        if (messageText.startsWith(config.prefix + "info")) {
            await sock.sendMessage(sender, { text: `🤖 Bot Name: ${config.botName}\n👤 Owner: ${config.ownerNumber}` });
        }

        if (messageText.startsWith(config.prefix + "joke")) {
            let jokes = ["Why don't scientists trust atoms? Because they make up everything!", 
                         "I'm reading a book on anti-gravity. It's impossible to put down!"];
            let randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
            await sock.sendMessage(sender, { text: randomJoke });
        }

        if (messageText.startsWith(config.prefix + "quote")) {
            let quotes = ["The only way to do great work is to love what you do. - Steve Jobs", 
                          "Believe you can and you're halfway there. - Theodore Roosevelt"];
            let randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            await sock.sendMessage(sender, { text: randomQuote });
        }

        if (messageText.startsWith(config.prefix + "define ")) {
            let word = messageText.replace(config.prefix + "define ", "").trim();
            if (word) {
                await sock.sendMessage(sender, { text: `🔍 Definition of ${word}: (Placeholder definition)` });
            } else {
                await sock.sendMessage(sender, { text: "Please provide a word to define." });
            }
        }
    });
}

startBot();
