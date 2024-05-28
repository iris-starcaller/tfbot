const path = require('node:path');
const muzzleHelper = require(path.join(__dirname, '..', '..', 'utilities', 'helpers', 'muzzleHelper.js'));
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

/*
addChoices(...choices: RestOrArray<APIApplicationCommandOptionChoice<ChoiceType>>) : this
Adds multiple choices to this option.

Inherited from: ApplicationCommandOptionWithChoicesMixin

setAutocomplete(autocomplete: boolean) : this
Whether this option uses autocomplete.

Inherited from: ApplicationCommandOptionWithAutocompleteMixin

setChoices<Input extends APIApplicationCommandOptionChoice<ChoiceType>>(...choices: RestOrArray<Input>) : this
Sets multiple choices for this option.

Inherited from: ApplicationCommandOptionWithChoicesMixin
*/
module.exports = {
    data: new SlashCommandBuilder()
        .setName('muzzle')
        .setDescription('Muzzle a pup.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The puppy to muzzle.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName("time")
                .setDescription("The amount of time to muzzle the pup for. (Specify time in minutes) Default=1hr")
                .setRequired(false))
        .addStringOption(option =>
            option.setName("type")
                .setDescription("The type of muzzle to use. Default=dog")
                .setRequired(false)),
    async execute(interaction) {
        if (!interaction.guild) return await interaction.reply({ content: 'This command can only be used in a server.',  ephemeral: true });
        if (interaction.user.id !== "1166312840861331459") {
            if(interaction.member.permissions.has(PermissionFlagsBits.ManageMessages) === false) return await interaction.reply({ content: 'Needy needy dog! ||(in all seriousness, you can ask a mod to have it put on yah, or use muzzleme.)||',  ephemeral: true });
        }
        const user = interaction.options.getUser('user');
        if (!user) return await interaction.reply({ content: 'Please specify a user to muzzle.',  ephemeral: true });
        const member = interaction.guild.members.cache.get(user.id);
        if (!member) return await interaction.reply({ content: 'User is not in this server.',  ephemeral: true });
        const stime = interaction.options.getString('time');
        const time = parseInt(stime);
        let timeInMs = 3600000;
        if (time) {
            if (isNaN(time)) return await interaction.reply({ content: 'Cmon pup, provide a valid number (in minutes) for the time.',  ephemeral: true });
            timeInMs = time * 60000;
            console.log(timeInMs);
        }
        
        const type = interaction.options.getString('type') || 'dog';
        await muzzleHelper.muzzle(member, {time: timeInMs, type});
        await interaction.reply({ content: 'Muzzled that silly puppo.'});
    },
};