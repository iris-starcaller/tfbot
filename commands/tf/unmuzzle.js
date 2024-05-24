const path = require('node:path');
const muzzleHelper = require(path.join(__dirname, '..', '..', 'utilities', 'helpers', 'muzzleHelper.js'));
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmuzzle')
        .setDescription('unMuzzle a pup.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The puppy to unmuzzle.')
                .setRequired(true)),
    async execute(interaction) {
        if (!interaction.guild) return await interaction.reply('This command can only be used in a server.', { ephemeral: true });
        if (interaction.user.id !== "1166312840861331459") {
            if(interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) === false) return await interaction.reply('Nuh uh! Bad dog! ||You can just ask a mod to remove it for yah||', { ephemeral: true });
        }
        const user = interaction.options.getUser('user');
        if (!user) return await interaction.reply('Please specify a user to unmuzzle.', { ephemeral: true });
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) return await interaction.reply('User is not in this server.', { ephemeral: true });

        
        await muzzleHelper.unmuzzle(member);
        await interaction.reply('Removed the muzzle from that good pup\'s maw.', { ephemeral: true });
    },
};