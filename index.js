require('dotenv').config();

const Cat = require('cat-loggr');
const log = new Cat();
const muzzleHelper = require('./utilities/helpers/muzzleHelper.js');
const sjdb = require('simple-json-db');
const fs = require('node:fs');
const path = require('node:path');
const Discord = require('discord.js');
const client = new Discord.Client({
    intents: [
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.DirectMessages,
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
    ]
})
client.commands = new Discord.Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

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
} // ty discord.js guide for this


client.once(Discord.Events.ClientReady, _cl => {
    log.info(`Logged in as ${client.user.tag}`);
})
function sna(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '');
}
function blacklistF(message, options) {
    if (options) {
        if (options.blacklist) {
            if (options.blacklist.length === 0) {
                return message;
            }
        } else {
            return message;
        }
    }
    return new Promise((resolve, reject) => {
        try {
            const blacklist = options.blacklist
            if (!blacklist) return message;
            if (!message) return message;
            if (blacklist.length === 0) return message;

            const censor = options.censorType || "spoiler"
            const messageArray = message.split(' ');
            const censoredMessage = messageArray.map(word => {
                if (blacklist.includes(sna(word.toLowerCase()))) {
                    switch (censor) {
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
        }
        catch (error) {
            resolve(message);
        }
    });
}

client.on(Discord.Events.MessageCreate, async message => {
    if (message.channel.type === 11 || message.channel.type === 'GUILD_PRIVATE_THREAD') return;
    const muzzled = new sjdb('shared/muzzled.json');
    const options = new sjdb('shared/config.json');
    if (!message.guild) return;
    if (message.author.bot) return;
    if (muzzled.get(message.author.id)) {
        if (!message.content) return;
        const muzzleTime = muzzled.get(message.author.id);
        if (muzzleTime < Date.now()) {
            muzzled.delete(message.author.id);
            log.warn(`Unmuzzled ${message.author.tag}`)
            return;
        }
        log.info(`Muzzling text from ${message.author.tag}`)
        const _muzzledMessage = await muzzleHelper.borkify(message.content + '')
        const webhook = await message.channel.fetchWebhooks();
        const user = await client.users.fetch(message.author.id);
        const guild = await client.guilds.fetch(message.guild.id);
        
        const userOptions = options.get(user.id) || null
        let muzzledMessage = await blacklistF(_muzzledMessage, userOptions);
        const shouldBypass = userOptions ? userOptions.allowBypass : false;
        if (shouldBypass) {
           const wordsInBrackets = message.content.match(/\{([^}]+)\}/g);
              if (wordsInBrackets) {
                muzzledMessage += `\n||${wordsInBrackets.join(' ')}||`;
              }
        }


        if (webhook.size === 0) {
            await message.delete();

            const newWebhook = await message.channel.createWebhook({
                name: user.username,
                avatar: user.avatarURL({ dynamic: true }),
            });

            await newWebhook.send({
                content: muzzledMessage.replace(/@/g, '@\u200B'),
                username: user.username,
                avatarURL: user.avatarURL({ dynamic: true }),
            });
        } else {
            try {
                const firstWebhook = webhook.first();
                await message.delete();
                await firstWebhook.send({
                    content: muzzledMessage.replace(/@/g, '@\u200B'),
                    username: user.username,
                    avatarURL: user.avatarURL({ dynamic: true }),
                });
            } catch (error) {
                if (!error) return;
                log.warn(error);
                await message.delete();

                const newWebhook = await message.channel.createWebhook({
                    name: user.username,
                    avatar: user.avatarURL({ dynamic: true }),
                });

                await newWebhook.send({
                    content: muzzledMessage.replace(/@/g, '@\u200B'),
                    username: user.username,
                    avatarURL: user.avatarURL({ dynamic: true }),
                });
            }
        }
    }
});


client.on(Discord.Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        log.warn(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        log.warn(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.login(process.env.auth_token);

