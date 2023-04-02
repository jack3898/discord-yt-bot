/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommandService, RestService } from '.';
import type { ICommand } from '../types/ICommand';
import { SlashCommandBuilder } from 'discord.js';
import { container } from 'tsyringe';

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

it('should register class tokens and retrieve them', () => {
	const commandService = container.resolve(CommandService);

	commandService.registerClassToken(MockClass);

	expect(nameSpy).toHaveBeenCalledTimes(1);

	const foundInstance = commandService.getCommandInstanceBySlashCommandName('testcommand');

	expect(foundInstance).toBeInstanceOf(MockClass);
});

it('should retrieve all slash command builders', () => {
	const commandService = container.resolve(CommandService);

	commandService.registerClassToken(MockClass);

	const builders = commandService.getCommandBuilders();

	expect(builders[0]).toBeInstanceOf(SlashCommandBuilder);
});

it('should retrieve all slash command builders as an array of RESTPostAPIChatInputApplicationCommandsJSONBody', () => {
	const commandService = container.resolve(CommandService);

	commandService.registerClassToken(MockClass);

	const builders = commandService.getCommandBuildersAsJson();

	expect(typeof builders[0].name).toBe('string');
	expect(builders[0]).not.toBeInstanceOf(SlashCommandBuilder);
});

it('should publish slash commands', async () => {
	const routeSpy = jest.fn();
	const putSpy = jest.fn();

	class MockRest {
		get commandsRoute() {
			routeSpy();

			return 'route';
		}

		put() {
			putSpy();

			return Promise.resolve(true);
		}
	}

	container.register(RestService, MockRest as any);

	const commandService = container.resolve(CommandService);

	await commandService.publishSlashCommands([]);

	expect(putSpy).toHaveBeenCalledTimes(1);
	expect(routeSpy).toHaveBeenCalledTimes(1);
});
