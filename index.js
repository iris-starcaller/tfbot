require('dotenv').config();

const Cat = require('cat-loggr');
const log = new Cat();
const muzzleHelper = require('./utilities/helpers/muzzleHelper');
const SimpleJsonDB = require('simple-json-db');
const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');

// Initialize Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
    ]
});

// Initialize commands collection
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Load commands from folders
for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            log.info(`Loaded command ${command.data.name} from ${filePath}`);
        } else {
            log.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Log when the client is ready
client.once(Events.ClientReady, client => {
    log.info(`Logged in as ${client.user.tag}`);
});

/**
 * Sanitize a string by removing non-alphanumeric characters.
 * @param {string} str - The input string.
 * @returns {string} - The sanitized string.
 */
function sanitizeString(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Censor blacklisted words in a message.
 * @param {string} message - The input message.
 * @param {object} options - The options object containing blacklist and censor type.
 * @returns {Promise<string>} - The censored message.
 */
function blacklistFilter(message, options) {
    return new Promise((resolve) => {
        try {
            const { blacklist = [], censorType = 'spoiler' } = options || {};
            if (blacklist.length === 0 || !message) return resolve(message);

            const messageArray = message.split(' ');
            const censoredMessage = messageArray.map(word => {
                if (blacklist.includes(sanitizeString(word.toLowerCase()))) {
                    switch (censorType) {
                        case 'spoiler':
                            return `||${word}||`;
                        case 'remove':
                            return '';
                        case 'bork':
                            return 'bork';
                        default:
                            return '*'.repeat(word.length);
                    }
                }
                return word;
            });
            resolve(censoredMessage.join(' '));
        } catch {
            resolve(message);
        }
    });
}

// Handle incoming messages
client.on(Events.MessageCreate, async message => {
    if (message.channel.type === 11 || message.channel.type === 'GUILD_PRIVATE_THREAD') return;

    const muzzledDB = new SimpleJsonDB('shared/muzzled.json');
    const configDB = new SimpleJsonDB('shared/config.json');
    if (!message.guild || message.author.bot) return;

    const muzzleTime = muzzledDB.get(message.author.id);
    if (muzzleTime) {
        if (muzzleTime < Date.now()) {
            muzzledDB.delete(message.author.id);
            log.warn(`Unmuzzled ${message.author.tag}`);
            return;
        }

        log.info(`Muzzling text from ${message.author.tag}`);
        const transformedMessage = await muzzleHelper.borkify(message.content);
        const userOptions = configDB.get(message.author.id) || {};
        let muzzledMessage = await blacklistFilter(transformedMessage, userOptions);

        if (userOptions.allowBypass) {
            const wordsInBrackets = message.content.match(/\{([^}]+)\}/g);
            if (wordsInBrackets) {
                muzzledMessage += `\n||${wordsInBrackets.join(' ')}||`;
            }
        }

        const webhooks = await message.channel.fetchWebhooks();
        if (webhooks.size === 0) {
            await message.delete();
            const newWebhook = await message.channel.createWebhook({
                name: message.author.username,
                avatar: message.author.avatarURL({ dynamic: true }),
            });
            await newWebhook.send({
                content: muzzledMessage.replace(/@/g, '@\u200B'),
                username: message.author.username,
                avatarURL: message.author.avatarURL({ dynamic: true }),
            });
        } else {
            try {
                const firstWebhook = webhooks.first();
                await message.delete();
                await firstWebhook.send({
                    content: muzzledMessage.replace(/@/g, '@\u200B'),
                    username: message.author.username,
                    avatarURL: message.author.avatarURL({ dynamic: true }),
                });
            } catch (error) {
                log.warn(error);
                await message.delete();
                const newWebhook = await message.channel.createWebhook({
                    name: message.author.username,
                    avatar: message.author.avatarURL({ dynamic: true }),
                });
                await newWebhook.send({
                    content: muzzledMessage.replace(/@/g, '@\u200B'),
                    username: message.author.username,
                    avatarURL: message.author.avatarURL({ dynamic: true }),
                });
            }
        }
    }
});

// Handle command interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        log.warn(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        log.warn(error);
        const replyOptions = { content: 'There was an error while executing this command!', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    }
});

// Log in to Discord
client.login(process.env.AUTH_TOKEN);
