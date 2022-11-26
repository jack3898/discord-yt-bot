/* eslint-disable @typescript-eslint/no-explicit-any */
import { container } from 'tsyringe';
import { BotService } from './BotService';
import { RestService } from './RestService';

afterEach(() => container.reset());

describe('registerSlashCommands method', () => {
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

		container.registerSingleton(RestService, MockRest as any);

		const bot = container.resolve(BotService);

		await bot.registerSlashCommands();

		expect(routeSpy).toHaveBeenCalledTimes(1);
		expect(putSpy).toHaveBeenCalledTimes(1);
	});

	it('should throw and error on failure to register slash commands', async () => {
		const routeSpy = jest.fn();
		const putSpy = jest.fn();

		class MockRest {
			get commandsRoute() {
				routeSpy();

				return 'route';
			}

			put() {
				putSpy();

				return Promise.reject(false);
			}
		}

		container.registerSingleton(RestService, MockRest as any);

		const bot = container.resolve(BotService);

		expect(bot.registerSlashCommands()).rejects.toBeInstanceOf(Error);
	});
});
