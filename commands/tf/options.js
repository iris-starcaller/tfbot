const path = require('node:path');
const fs = require('node:fs');
const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const sjdb = require('simple-json-db');

let dbpath = path.join(__dirname, '..', '..', 'shared', 'config.json')
if (!fs.existsSync(dbpath)) {
    dbpath = path.join(__dirname, 'shared', 'config.json');
}
const db = new sjdb(dbpath);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('options')
        .setDescription('Change muzzle options.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('blacklist')
                .setDescription('Add or remove words from the blacklist.')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('The action to perform.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'add', value: 'add' },
                            { name: 'remove', value: 'remove' },
                            { name: 'clear (put anything in word)', value: 'clear' }
                        )
                )
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('The word to add or remove from the blacklist.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('whitelist')
                .setDescription('Add or remove words from the whitelist.')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('The action to perform.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'add', value: 'add' },
                            { name: 'remove', value: 'remove' }
                        )
                )
                .addStringOption(option =>
                    option.setName('word')
                        .setDescription('The word to add or remove from the whitelist.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('censor')
                .setDescription('Change the censor type.')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of censor to use.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'spoiler', value: 'spoiler' },
                            { name: 'remove', value: 'remove' },
                            { name: 'bork', value: 'bork' },
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('type')
                .setDescription('Change the muzzle type.')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('The type of muzzle to use.')
                        .setRequired(true)
                        .addChoices(
                            { name: 'dog', value: 'dog' },
                            { name: 'cat', value: 'cat' },
                            { name: 'horse', value: 'horse' },
                            { name: 'wolf', value: 'wolf' },
                            { name: 'fox', value: 'fox' },
                            { name: 'bunny', value: 'bunny' },
                            { name: 'bird', value: 'bird' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('viewconfig')
                .setDescription('View your current muzzle configuration.')


        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('bypass')
                .setDescription('Toggle the ability to bypass the muzzle with {}.')
                .addBooleanOption(option =>
                    option.setName('allow')
                        .setDescription('Whether to allow bypassing the muzzle.')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        if (!interaction.guild) {
            return await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const user = interaction.user;
        const userId = user.id;
        let userDBentry = db.get(userId) || {
            blacklist: [],
            whitelist: [],
            censorType: 'spoiler',
            type: 'dog',
            allowBypass: false,
        };

        const subcommand = interaction.options.getSubcommand();
        const word = interaction.options.getString('word');
        const action = interaction.options.getString('action');
        const type = interaction.options.getString('type');
        const allow = interaction.options.getBoolean('allow');

        switch (subcommand) {
            case 'blacklist':
                if (action === 'clear') {
                    userDBentry.blacklist = [];
                    break;
                }
                handleListUpdate(userDBentry, 'blacklist', action, word.toLowerCase());
                break;
            case 'whitelist':
                handleListUpdate(userDBentry, 'whitelist', action, word.toLowerCase());
                break;
            case 'censor':
                userDBentry.censorType = type;
                break;
            case 'type':
                userDBentry.type = type;
                break;
            case 'bypass':
                userDBentry.allowBypass = allow;
                break;
            case 'viewconfig':
                const _blacklist = userDBentry.blacklist || [];
                const _whitelist = userDBentry.whitelist || [];
                const _censorType = userDBentry.censorType || 'spoiler';
                const _type = userDBentry.type || 'dog';
                const _allowBypass = userDBentry.allowBypass || false;
                const config = {
                    blacklist: _blacklist,
                    whitelist: _whitelist,
                    censorType: _censorType,
                    type: _type,
                    allowBypass: _allowBypass,
                };
                return await interaction.reply({ content: '```json\n' + JSON.stringify(config, null, 4) + '```', ephemeral: true });
            default:
                return await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true });
        }

        db.set(userId, userDBentry);
        await interaction.reply({ content: `Successfully updated your settings for ${subcommand}.`, ephemeral: true });
    },
};

function handleListUpdate(userDBentry, listType, action, word) {
    if (!userDBentry[listType]) {
        userDBentry[listType] = [];
    }

    const list = userDBentry[listType];
    if (action === 'add') {
        if (!list.includes(word)) {
            list.push(word);
        }
    } else if (action === 'remove') {
        const index = list.indexOf(word);
        if (index !== -1) {
            list.splice(index, 1);
        }
    }
}
