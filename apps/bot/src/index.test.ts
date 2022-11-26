import { container } from 'tsyringe';
import { Main } from '.';

it('should test', () => {
	const mock = container.resolve(Main);

	expect(mock.test).toBeTruthy();
});
