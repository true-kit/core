import {
	ThemeRules,
	ThemeSpec,
	Theme,
	ThemeRegistry,
	LikeComponent,
	ThemeOverride,
	GetComponentTheme,
	ThemeOverrideIndex,
} from './theme.types';

import {
	convertThemeRulesToCSSRules,
	convertCSSRulesToCSSClasses,
	convertCSSClassesToThemeClasses,
	createToStringCode,
} from './theme.convert';

import { ThemeStyle } from './theme.style';

import { Last, Cast } from '../core.types';

import { EnvContextEntry } from '../env/env.types';
import { createEnvContextProvider, getEnvContext, getActiveEnvScope } from '../env/env';


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

const nullTheme = createThemeFor(null as any)({
	host: {},
	elements: {},
});

export const ThemeProvider = createEnvContextProvider('theme');

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

		let ctx = getEnvContext();

		while (ctx && ctx.theme) {
			const {
				map,
				overrides,
			} = ctx.theme;

			if (
				overrides !== null
				&& getActiveEnvScope() !== null
				&& overrides.has(Target)
			) {
				const overTheme = getThemeOverride(overrides.get(Target)!, ctx);
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

function getThemeOverride(list: ThemeOverride[], ctx: EnvContextEntry): Theme<any> | null {
	for (let i = 0; i < list.length; i++) {
		let {value: theme, xpath} = list[i];
		let scope = getActiveEnvScope();

		XPATH: for (let x = 0, xn = xpath.length; x < xn; x++) {
			const Node = xpath[x];

			while (true) {
				scope = scope!.parent;

				if (scope === null || scope.ctx === ctx) {
					theme = null as any;
					break XPATH;
				}

				if (scope.Owner === Node) {
					break;
				}
			}
		}

		if (theme !== null) {
			return theme;
		}
	}

	return null;
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
			const Node = xpath.pop();

			if (xpath.length >= 1 && Node) {
				index.set(Node, (index.get(Node) || []).concat({
					value: override.value,
					xpath,
				}));
			} else {
				console.warn('[@truekit/core: theme] Invalid override: ', override);
			}

			return index;
		}, new Map as ThemeOverrideIndex),
	};
}

export function createThemeOverrideFor<
	X extends any[],
	T extends GetComponentTheme<Last<X>>,
>(...xpath: X): (theme: Cast<T, Theme<any>>) => ThemeOverride {
	return (theme): ThemeOverride => ({
		value: theme,
		xpath,
	});
}