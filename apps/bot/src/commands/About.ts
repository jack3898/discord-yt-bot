import { ROOT } from '@yt-bot/constants/src/environment';
import { t } from '@yt-bot/i18n';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import path from 'path';
import { injectable } from 'tsyringe';
import { LANG } from '../langpacks';
import { ICommand } from '../types/ICommand';

const COMMAND = LANG.COMMANDS.ABOUT;

@injectable()
export class About implements ICommand {
	definition = new SlashCommandBuilder().setName(COMMAND.NAME).setDescription(COMMAND.DESC);

	async execute(interaction: ChatInputCommandInteraction<'cached'>) {
		try {
			const rootPackageJson: Record<PropertyKey, unknown> | undefined = await import(
				path.resolve(ROOT, 'package.json')
			);

			const embed = new EmbedBuilder().setTitle(COMMAND.RESPONSE.SUCCESS_EMBED.TITLE).setDescription(
				t(COMMAND.RESPONSE.SUCCESS_EMBED.DESCRIPTION, {
					version: rootPackageJson?.version
				})
			);

			interaction.reply({
				embeds: [embed],
				ephemeral: true
			});
		} catch (error) {
			console.error(error);

			const message = 'There was an internal server problem.';

			interaction.replied ? interaction.editReply(message) : interaction.reply(message);
		}
	}
}
