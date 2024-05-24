const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with bot statistics.'),
	async execute(interaction) {
        await interaction.reply(`\`Latency is ${Date.now() - interaction.createdTimestamp}ms.\`\n\`API Latency is ${Math.round(interaction.client.ws.ping)}ms.\``);
	},
};