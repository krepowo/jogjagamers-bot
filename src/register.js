const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
require('colors');
require('dotenv').config();

const commands = require('./commands');
const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
	try {
		console.log('[Discord API] Started refreshing application (/) commands.'.yellow);
		await rest.put(
			Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
			{ body: commands },
		);
		console.log('[Discord API] Successfully reloaded application (/) commands.'.green);
	} catch (error) {
		console.error(error);
	}
})();