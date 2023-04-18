import type { CommandInteraction, ICommand, Percent } from '../types';
import { SlashCommandBuilder } from 'discord.js';
import { VoiceService } from '../services';
import { injectable } from 'tsyringe';

@injectable()
export class Volume implements ICommand {
	constructor(private voiceService: VoiceService) {}

	definition = new SlashCommandBuilder()
		.setName('volume')
		.setDescription('Change the volume of the bot.')
		.addNumberOption((option) =>
			option.setName('percentage').setDescription('How loud?').setMinValue(0).setMaxValue(100)
		);

	async execute(interaction: CommandInteraction) {
		const userVolumeChoice = interaction.options.getNumber('percentage') || undefined;
		const clampedVolume = userVolumeChoice && (Math.min(Math.max(userVolumeChoice, 0), 100) as Percent);
		const volume = await this.voiceService.guildVolume(interaction.guild, clampedVolume);
		this.voiceService.setAudioResourceVolume(interaction.guild, volume);

		const volumeInfoLength = volume / 10;

		const emojiGraphic = Array.from({ length: 10 })
			.map((_, index) => (volumeInfoLength > index ? '🟩' : '⬜'))
			.join('');

		return userVolumeChoice
			? interaction.reply(`Volume set to \`${volume}%\`\n\n${emojiGraphic}`)
			: interaction.reply(`Current volume is \`${volume}%\`\n\n${emojiGraphic}`);
	}
}
