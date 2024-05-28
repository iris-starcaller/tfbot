const path = require('node:path');
const muzzleHelper = require(path.join(__dirname, '..', '..', 'utilities', 'helpers', 'muzzleHelper.js'));
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('types')
        .setDescription('list muzzle types'),
    async execute(interaction) {
        let desc = `
Types of Muzzles:
- dog
- cat
- donkey
- gag
- wolf
---`
        await interaction.reply({ content: '```'+desc+'```',  ephemeral: true });
    },
};