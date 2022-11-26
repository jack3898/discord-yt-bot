import { SlashCommandBuilder } from 'discord.js';
import { container } from 'tsyringe';
import { CommandService } from '.';
import { ICommand } from '../types/ICommand';

const commandService = container.resolve(CommandService);

const nameSpy = jest.fn();

class MockClass implements ICommand {
	get definition() {
		nameSpy();

		return new SlashCommandBuilder().setName('testcommand').setDescription('this is a test');
	}

	execute() {
		return true;
	}
}

afterEach(() => {
	jest.resetAllMocks();
});

it('should register class tokens and retrieve them', () => {
	commandService.registerClassToken(MockClass);

	expect(nameSpy).toHaveBeenCalledTimes(2); // One to save it and the other for the console log

	const foundInstance = commandService.getCommandInstanceBySlashCommandName('testcommand');

	expect(foundInstance).toBeInstanceOf(MockClass);
});

it('should retrieve all slash command builders', () => {
	commandService.registerClassToken(MockClass);

	const builders = commandService.getCommandBuilders();

	expect(builders[0]).toBeInstanceOf(SlashCommandBuilder);
});

it('should retrieve all slash command builders as an array of RESTPostAPIChatInputApplicationCommandsJSONBody', () => {
	commandService.registerClassToken(MockClass);

	const builders = commandService.getCommandBuildersAsJson();

	expect(typeof builders[0].name).toBe('string');
	expect(builders[0]).not.toBeInstanceOf(SlashCommandBuilder);
});
