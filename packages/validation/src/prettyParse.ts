import type { ZodObject, ZodRawShape } from 'zod';

/**
 * Run a Zod parse, but the thrown error is easier to read!
 */
export function prettyParse<T extends ZodRawShape>(z: ZodObject<T>, data: unknown) {
	const parsed = z.safeParse(data);

	if (parsed.success) {
		return parsed.data;
	}

	console.error(parsed.error.format());
	process.exit(1);
}
