require('dotenv').config();
const { Client, GatewayIntentBits, Events, Collection, ActivityType } = require('discord.js');
const Cat = require('cat-loggr');
const log = new Cat();
const muzzleHelper = require('./utilities/helpers/muzzleHelper');
const SimpleJsonDB = require('simple-json-db');
const fs = require('fs');
const path = require('path');

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
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(folderPath, file);
        const command = require(filePath);

        if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            log.info(`Loaded command ${command.data.name} from ${filePath}`);
        } else {
            log.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Log when the client is ready and set the activity
client.once(Events.ClientReady, c => {
    log.info(`Logged in as ${c.user.tag}`);
    c.user.setActivity({ name: 'with pups', type: ActivityType.Playing });
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
async function blacklistFilter(message, options) {
    const { blacklist = [], censorType = 'spoiler' } = options;
    if (!blacklist.length || !message) return message;

    const censoredMessage = message.split(' ').map(word => {
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

    return censoredMessage.join(' ');
}
/**
 * Converts mentions to "@nickname" in a given message.
 * @param {Discord.Message} message - The message object from Discord.js.
 * @returns {string} - The content of the message with mentions replaced by "@nickname".
 */
async function convertMentionsToNicknames(message) {
    let content = message.content;

    for (const user of message.mentions.users.values()) {
        const member = await message.guild.members.fetch(user.id);
        const nickname = member ? member.displayName : user.username;
        const mention = `<@${user.id}>`; // Mention format without the exclamation mark
        content = content.replace(new RegExp(mention, 'g'), `@${nickname}`);
    }
    return content;
}

let isFirst = true;
const analytics = [];

client.on(Events.MessageCreate, async message => {
    if (message.channel.type === 11 || message.channel.type === 'GUILD_PRIVATE_THREAD') return;

    const muzzledDB = new SimpleJsonDB('shared/muzzled.json');
    const configDB = new SimpleJsonDB('shared/config.json');
    if (!message.guild || message.author.bot) return;

    const muzzleTime = muzzledDB.get(message.author.id);
    if (muzzleTime) {
        if (muzzleTime.time < Date.now()) {
            muzzledDB.delete(message.author.id);
            log.warn(`Unmuzzled ${message.author.tag}`);
            return;
        }

        const userOptions = configDB.get(message.author.id) || {};
        const muzzleType = userOptions.type || 'dog';
        if (!message.content.length) return;

        log.info(`Muzzling text from ${message.author.tag}, using ${muzzleType} muzzle.`);
        const trackTime = Date.now();
        message.content = await convertMentionsToNicknames(message);
        let transformedMessage = message.content;

        switch (muzzleType) {
            case 'dog':
                transformedMessage = await muzzleHelper.borkify(message.content);
                break;
            case 'cat':
                transformedMessage = await muzzleHelper.catify(message.content);
                break;
            case 'wolf':
                transformedMessage = await muzzleHelper.wolfify(message.content);
                break;
            case 'gag':
                transformedMessage = await muzzleHelper.gagify(message.content);
                break;
            case 'donkey':
                transformedMessage = await muzzleHelper.donkeyfy(message.content);
                break;
            default:
                transformedMessage = await muzzleHelper.borkify(message.content);
                break;
        }

        let appendMessage = '';
        if (isFirst && (Date.now() - trackTime > 1000)) {
            appendMessage = ' (Likely extra time due to first-time loading / initialization)';
        }
        log.info(`Muzzled message. Content length: ${transformedMessage.length}. Time taken: ${Date.now() - trackTime}ms.${appendMessage}`);

        analytics.push(Date.now() - trackTime);
        if (analytics.length > 10) analytics.shift();
        if (analytics.length === 10) {
            const averageTime = analytics.reduce((a, b) => a + b, 0) / analytics.length;
            if (Date.now() - trackTime > averageTime * 2) {
                log.warn(`Muzzle time for ${message.author.tag} is ${Date.now() - trackTime}ms, which is more than double the average time of ${averageTime}ms.`);
            } else {
                log.debug(`Muzzle time for ${message.author.tag} is ${Date.now() - trackTime}ms, which is within the average time of ${averageTime}ms.`);
            }
        }
        isFirst = false;

        let muzzledMessage = await blacklistFilter(transformedMessage, userOptions);

        if (userOptions.allowBypass) {
            const wordsInBrackets = message.content.match(/\{([^}]+)\}/g);
            if (wordsInBrackets) {
                muzzledMessage += `\n||${wordsInBrackets.join(' ')}||`;
            }
        }

        const webhooks = await message.channel.fetchWebhooks();
        if (!webhooks.size) {
            await message.delete().catch(log.warn);
            const newWebhook = await message.channel.createWebhook({
                name: message.author.username,
                avatar: message.author.displayAvatarURL({ dynamic: true }),
            });
            await newWebhook.send({
                content: muzzledMessage.replace(/@/g, '@\u200B'),
                username: message.author.username,
                avatarURL: message.author.displayAvatarURL({ dynamic: true }),
            });
        } else {
            const webhook = webhooks.first();
            await message.delete().catch(log.warn);
            try {
                await webhook.send({
                    content: muzzledMessage.replace(/@/g, '@\u200B'),
                    username: message.author.username,
                    avatarURL: message.author.displayAvatarURL({ dynamic: true }),
                });
            } catch (error) {
                log.warn(error);
                const newWebhook = await message.channel.createWebhook({
                    name: message.author.username,
                    avatar: message.author.displayAvatarURL({ dynamic: true }),
                });
                await newWebhook.send({
                    content: muzzledMessage.replace(/@/g, '@\u200B'),
                    username: message.author.username,
                    avatarURL: message.author.displayAvatarURL({ dynamic: true }),
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
        switch (interaction.commandName) {
            case 'ping':
                await command.execute(interaction, analytics);
                break;
            default:
                await command.execute(interaction);
                break;
        }
        //await command.execute(interaction);
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
