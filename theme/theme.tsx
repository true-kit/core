import {
	ThemeRules,
	ThemeSpec,
	Theme,
	ThemeRegistry,
	LikeComponent,
	ThemeOverride,
	GetThemeFromDescriptor,
	ThemeOverrideIndex,
	AllThemes,
} from './theme.types';

import {
	convertThemeRulesToCSSRules,
	convertCSSRulesToCSSClasses,
	convertCSSClassesToThemeClasses,
	createToStringCode,
} from './theme.convert';

import { ThemeStyle } from './theme.style';

import { DescriptorWithMeta, Last, Cast } from '../core.types';
import { EnvContextEntry } from '../env/env.types';
import { createEnvContextProvider, getEnvContext, getActiveEnvScope } from '../env/env';


export function createThemeRegistryFor<
	D extends DescriptorWithMeta<any, any>
>(
	descriptor: D,
	themesMap: AllThemes<D>,
	overrides?: ThemeOverride[] | null,
): ThemeRegistry {
	return createThemeRegistry(
		Object.values(themesMap).map(theme => theme) as Theme<any>[],
		overrides,
	);
}

export function createThemeFor<
	D extends DescriptorWithMeta<any, {theme?: Theme<any>}>,
	TS extends ThemeSpec = NonNullable<D['meta']['theme']>['spec'],
>(descriptor: D, rules: ThemeRules<TS>): Theme<TS> {
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
		const store = this.store;

		if (store === null || store.hasOwnProperty(name)) {
			const style = new ThemeStyle(
				name,
				name === 'host' ? classes[name] : classes['elements'][name],
				classNames,
			) as any;

			if (store === null) {
				return style
			}

			store[name] = style;
		}

		return store[name];
	}

	return {
		descriptor: descriptor as any,
		for: _for,
		cssRules,
		classes,
		store: null,
		persist(store: object) {
			const wr = Object.create(this);
			wr.store = store;
			return wr;
		},
	} as Theme<TS>;
}

const nullTheme = createThemeFor(null as any, {
	host: {},
	elements: {},
});

export const ThemeProvider = createEnvContextProvider('theme');

export function getTheme<
	D extends DescriptorWithMeta<any, {theme?: Theme<any>}>,
	T extends Theme<any> = NonNullable<D['meta']['theme']>,
>(descriptor: D, props: {theme?: T}): T {
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
				&& overrides.has(descriptor)
			) {
				const overTheme = getThemeOverride(overrides.get(descriptor)!, ctx);
				if (overTheme !== null) {
					theme = overTheme as T;
					break;
				}
			}

			if (map !== null && map.has(descriptor)) {
				theme = map.get(descriptor) as T;
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
			const descr = xpath[x];

			while (true) {
				scope = scope!.parent;

				if (scope === null || scope.ctx === ctx) {
					theme = null as any;
					break XPATH;
				}

				if (scope.owner === descr) {
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
			map.set(theme.descriptor, theme);
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
	X extends DescriptorWithMeta<any, {theme?: Theme<any>}>[]
>(...xpath: X): (theme: GetThemeFromDescriptor<Last<X>>) => ThemeOverride {
	return (theme): ThemeOverride => ({
		value: theme as any,
		xpath,
	});
}