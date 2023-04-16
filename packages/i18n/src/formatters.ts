export function generateFormatters(locale: string) {
	return {
		numberFormat: Intl.NumberFormat(locale),
		dateTimeFormat: Intl.DateTimeFormat(locale),
		sentenceSegmenter: new Intl.Segmenter(locale, { granularity: 'sentence' })
	};
}
