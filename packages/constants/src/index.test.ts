import { ENV } from '.';
import { existsSync } from 'fs';
import { resolve } from 'path';

test('that ROOT points to the root of the monorepo', async () => {
	const exists = existsSync(resolve(ENV.ROOT, 'LICENSE'));

	expect(exists).toBeTruthy();
});
