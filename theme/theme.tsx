import * as React from 'react';

import {
	ThemeRules,
	ThemeSpec,
	Theme,
	ThemeProviderValue,
	ThemeProviderProps,
	ThemeRegistry,
	LikeComponent,
	ThemeOverride,
	GetComponentTheme,
	ThemeScopeEnv,
} from './theme.types';

import {
	convertThemeRulesToCSSRules,
	convertCSSRulesToCSSClasses,
	convertCSSClassesToThemeClasses,
	createToStringCode,
} from './theme.convert';

import { ThemeStyle } from './theme.style';
import { Last, Cast } from '../core.types';


export function createThemeFor<
	TS extends ThemeSpec,
	T extends Theme<TS>,
>(Target: LikeComponent<T>) {
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
const nullTheme = createThemeFor(null as any)({
	host: {},
	elements: {},
});

let activeThemeScopeEnv: ThemeScopeEnv = null;

export function getTheme<
	TS extends ThemeSpec,
	T extends Theme<TS>,
>(
	Target: LikeComponent<T>,
	props: {theme?: T},
): T {
	let theme = props.theme;

	if (theme == null) {
		theme = nullTheme as T;

		let ctx = React.useContext(ThemeContext);

		while (ctx) {
			const {
				map,
				overrides,
			} = ctx.value;

			if (
				overrides !== null
				&& activeThemeScopeEnv !== null
				&& overrides.has(Target)
			) {
				const overTheme = getThemeOverride(overrides.get(Target), ctx);
				if (overTheme !== null) {
					theme = overTheme as T;
					break;
				}
			}

			if (map !== null && map.has(Target)) {
				theme = map.get(Target) as T;
				break;
			}

			ctx = ctx.parent!;
		}
	}

	return theme;
}

function getThemeOverride({theme, xpath}: ThemeOverride, ctx: ThemeProviderValue): Theme<any> | null {
	let scope = activeThemeScopeEnv;

	for (let i = 0, n = xpath.length; i < n; i++) {
		const Node = xpath[i];

		while (true) {
			scope = scope.parent;
			if (scope === null || scope.ctx === ctx) return null;
			if (scope.Owner === Node) break;
		}
	}

	// console.log('finded:', scope.Owner && scope.Owner.name);

	return theme;
}

function EndThemeScopeEnvAnchohr() {
	// console.log('End:', activeThemeScopeEnv.Owner && activeThemeScopeEnv.Owner.name);
	activeThemeScopeEnv = activeThemeScopeEnv.parent;
	return null;
};

export function withThemeScopeEnv<R>(
	Owner: LikeComponent<any>,
	executer: () => R,
	ctx?: ThemeProviderValue,
): R {
	const overrideThemeEnabled = (ctx || activeThemeScopeEnv) != null;

	if (overrideThemeEnabled) {
		const themeScopeEnv: ThemeScopeEnv = {
			parent: activeThemeScopeEnv,
			ctx: ctx || null,
			Owner,
		};

		activeThemeScopeEnv = themeScopeEnv;
	}

	const fragment = executer();

	if (overrideThemeEnabled) {
		// console.log('Start:', Target && Target.name);
		return <>{fragment}<EndThemeScopeEnvAnchohr/></> as any;
	}

	return fragment;
}

export function createThemeRegistry(
	themes: Theme<any>[] | null,
	overrides?: ThemeOverride[] | null,
): ThemeRegistry {
	return {
		map: !themes ? null : themes.reduce((map, theme) => {
			map.set(theme.Owner, theme);
			return map;
		}, new Map),

		overrides: !overrides ? null : overrides.reduce((index, override) => {
			const xpath = override.xpath.slice();

			index.set(xpath.pop(), {
				theme: override.theme,
				xpath,
			});

			return index;
		}, new Map),
	};
}

export function createThemeOverrideFor<
	X extends any[],
	T extends GetComponentTheme<Last<X>>,
>(...xpath: X): (theme: Cast<T, Theme<any>>) => ThemeOverride {
	return (theme): ThemeOverride => ({
		theme,
		xpath,
	});
}

export function ThemeProvider(props: ThemeProviderProps) {
	const next = {
		parent: React.useContext(ThemeContext),
		value: props.value,
	};

	return withThemeScopeEnv(null, () => {
		return <ThemeContext.Provider value={next}>{props.children}</ThemeContext.Provider>;
	}, next);
}
