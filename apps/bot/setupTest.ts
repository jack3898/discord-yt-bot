import 'reflect-metadata';
import { container } from 'tsyringe';

global.beforeEach(() => {
	jest.resetAllMocks();
});

global.afterEach(() => {
	container.reset();
});
