import handlebars, { TemplateDelegate } from 'handlebars';

const cache = new Map<string, TemplateDelegate>();

/**
 * Translation.
 */
export function t(input: string, context: Record<PropertyKey, unknown>) {
	const compiled = cache.has(input) ? (cache.get(input) as TemplateDelegate) : handlebars.compile(input);

	return compiled(context);
}
