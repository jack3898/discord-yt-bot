module.exports = {
	env: { es2021: true },
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended'
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module'
	},
	plugins: ['@typescript-eslint'],
	rules: {
		'prettier/prettier': [
			'error',
			{
				singleQuote: true,
				tabWidth: 4,
				useTabs: true,
				semi: true,
				bracketSpacing: true,
				printWidth: 125,
				trailingComma: 'none',
				arrowParens: 'always',
				endOfLine: 'lf'
			}
		],
		indent: ['error', 'tab'],
		'linebreak-style': ['error', 'unix'],
		quotes: ['error', 'single'],
		semi: ['error', 'always']
	}
};
