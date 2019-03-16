import * as React from 'react';

import {
	ThemeRules,
	ThemeSpec,
	Theme,
	ThemeProviderValue,
	ThemeProviderProps,
	MapOfTheme,
} from './theme.types';

import {
	convertThemeRulesToCSSRules,
	convertCSSRulesToCSSClasses,
	convertCSSClassesToThemeClasses,
	createToStringCode,
} from './theme.convert';

import { ThemeStyle } from './theme.style';


export function createThemeFor<
	TS extends ThemeSpec,
	T extends Theme<TS>,
>(Target: (props: {theme?: T}) => JSX.Element) {
	return function themeFactory(rules: ThemeRules<T['spec']>): T {
		const cssRules = convertThemeRulesToCSSRules(rules);
		const cssClasses = convertCSSRulesToCSSClasses(cssRules);
		const classes = convertCSSClassesToThemeClasses(cssClasses);
		const toStringCode = [
			`
			var k;
			var n = this.name;
			var s = this.state;
			var c = this.classes;
			`
		];

		createToStringCode(toStringCode, 'host', classes['host']);
		Object.entries(classes['elements']).forEach(([name, classes]) => {
			createToStringCode(toStringCode, name, classes);
		});

		const classNames = Function(`
			${toStringCode.join('\n')}
			return '';
		`);

		function _for(name: string) {
			const registry = this.registry;

			if (registry === null || registry.hasOwnProperty(name)) {
				const style = new ThemeStyle(
					name,
					name === 'host' ? classes[name] : classes['elements'][name],
					classNames,
				) as any;

				if (registry === null) {
					return style
				}

				registry[name] = style;
			}

			return registry[name];
		}

		return {
			Owner: Target as Function,
			for: _for,
			cssRules,
			classes,
			registry: null,
			withRegistry(registry: object) {
				const wr = Object.create(this);
				wr.registry = registry;
				return wr;
			},
		} as T;
	};
}

const ThemeContext = React.createContext<ThemeProviderValue>(null as any);

export function ThemeProvider(props: ThemeProviderProps) {
	const next = {
		parent: React.useContext(ThemeContext),
		value: props.value,
	};

	return (
		<ThemeContext.Provider value={next}>
			{props.children}
		</ThemeContext.Provider>
	);
}

const nullTheme = createThemeFor(null as any)({
	host: {},
	elements: {},
})

export function getTheme<
	TS extends ThemeSpec,
	T extends Theme<TS>,
>(
	Target: (props: {theme?: T}) => JSX.Element,
	props: {theme?: T},
): T {
	if (props.theme != null) {
		return props.theme;
	}

	let ctx = React.useContext(ThemeContext);

	if (ctx) {
		do {
			if (ctx.value.has(Target)) {
				return ctx.value.get(Target) as T;
			}
		} while (ctx = ctx.parent!);
	}

	return nullTheme as any as T;
}

export function composeThemes(...themes: Theme<any>[]): MapOfTheme {
	const map: MapOfTheme = new Map();

	themes.forEach((theme) => {
		map.set(theme.Owner, theme);
	});

	return map;
}

export function toProps(theme: string): React.AllHTMLAttributes<HTMLElement> {
	return {
		className: theme,
	};
}