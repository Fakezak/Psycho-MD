const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const fs = require('fs-extra');
const readline = require('readline-sync');
const chalk = require('chalk');
const config = require("./config");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
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
                console.log(chalk.redBright('Login expired. Restart and scan QR code.'));
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
                *${config.prefix}rank* - View your rank\n
                *${config.prefix}afk [reason]* - Set AFK mode\n
                *${config.prefix}kick @user* - Remove a user\n
                *${config.prefix}promote @user* - Make admin\n
                *${config.prefix}mute @user* - Mute a user\n
                *${config.prefix}sticker* - Convert image to sticker\n
                *${config.prefix}ytmp3 [link]* - Download YouTube audio\n
                *${config.prefix}weather [city]* - Get weather info\n
                *${config.prefix}news* - Latest news\n\n
                More commands coming soon! 🚀`;
            
            await sock.sendMessage(sender, { text: menuText });
        }
    });
}

async function handleUserInput() {
    const startCommand = readline.question(chalk.cyan('\nEnter "startbot" to start the bot: '));

    if (startCommand.toLowerCase() === 'startbot') {
        console.log(chalk.green('\nStarting the bot...'));
        await startBot();
    } else {
        console.log(chalk.red('\nInvalid command! Please enter "startbot" to start the bot.'));
    }
}

handleUserInput();