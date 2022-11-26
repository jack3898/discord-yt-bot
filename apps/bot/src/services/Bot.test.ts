import { container } from 'tsyringe';
import { Bot } from './Bot';
import { Rest } from './Rest';

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

		container.registerSingleton(Rest, MockRest as any);

		const bot = container.resolve(Bot);

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

		container.registerSingleton(Rest, MockRest as any);

		const bot = container.resolve(Bot);

		expect(bot.registerSlashCommands()).rejects.toBeInstanceOf(Error);
	});
});
