const path = require('node:path');
const muzzleHelper = require(path.join(__dirname, '..', '..', 'utilities', 'helpers', 'muzzleHelper.js'));
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

function timeDifference(minutes) {
    const units = [
        { unit: 'year', seconds: 525600 },
        { unit: 'month', seconds: 43200 },
        { unit: 'week', seconds: 10080 },
        { unit: 'day', seconds: 1440 },
        { unit: 'hour', seconds: 60 },
        { unit: 'minute', seconds: 1 }
    ];
    
    for (const { unit, seconds } of units) {
        const count = Math.floor(minutes / seconds);
        if (count >= 1) {
            return `${count} ${unit}${count > 1 ? 's' : ''}`;
        }
    }

    return 'just now';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('muzzleme')
        .setDescription('Muzzles you! Use this at your own risk pup, you\'ll need someone else to unmuzzle you.')
        .addStringOption(option =>
            option.setName("time")
                .setDescription("How long do you want to be a good boy for? (Specify time in minutes) Default=1hr")
                .setRequired(false))
        .addStringOption(option =>
            option.setName("type")
                .setDescription("The type of muzzle to use. Default=dog")
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.guild) return await interaction.reply({ content: 'This command can only be used in a server.',  ephemeral: true });
        const user = interaction.user;
        if (!user) return await interaction.reply({ content: 'what the.. are you even real?', ephemeral: true });
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) return await interaction.reply({ content: 'User is not in this server.', ephemeral: true });
        const stime = interaction.options.getString('time');
        const time = parseInt(stime);
        let timeInMs = 3600000;
        let formattedTime = '1 hour';
        
        if (time) {
            if (isNaN(time)) return await interaction.reply({ content: 'Cmon pup, provide a valid number (in minutes) for the time.', ephemeral: true });
            timeInMs = time * 60000;
            formattedTime = timeDifference(time);
            console.log(timeInMs);
        }
        
        const type = interaction.options.getString('type') || 'dog';

        await muzzleHelper.muzzle(member, {time: timeInMs, type});
        await interaction.reply(`<@${user.id}> decided that they should be a good dog and put on their own muzzle~! They’ve decided that they will be such a good dog for ${formattedTime}.`);
    },
};
