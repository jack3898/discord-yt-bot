import { z } from 'zod';

export default z
	.union([z.literal('development'), z.literal('production'), z.literal('test')], {
		invalid_type_error: 'NODE_ENV is not valid.',
		required_error: 'NODE_ENV is required!'
	})
	.default('production');
