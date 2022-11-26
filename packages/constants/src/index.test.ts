import fs from 'fs';
import path from 'path';
import { ROOT } from '.';

test('that ROOT points to the root of the monorepo', async () => {
	const exists = fs.existsSync(path.resolve(ROOT, 'LICENSE'));

	expect(exists).toBeTruthy();
});
