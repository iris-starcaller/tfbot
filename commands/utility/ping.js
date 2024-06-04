const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with bot statistics.'),
	async execute(interaction, analytics) {
		if (analytics.length === 0) return await interaction.reply({ content: 'No muzzle data available.', ephemeral: true });
		const averageTime = analytics.reduce((a, b) => a + b, 0) / analytics.length;
		const message = await interaction.reply({ content: 'Pinging...', fetchReply: true });
		const ping = message.createdTimestamp - interaction.createdTimestamp;

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Pong!')
			.setDescription(`Bot latency: ${ping}ms\nAPI latency: ${interaction.client.ws.ping}ms\nAverage muzzle time: ${averageTime}ms`)
			.setTimestamp();
		await interaction.editReply({ embeds: [embed] });
		
	},
};