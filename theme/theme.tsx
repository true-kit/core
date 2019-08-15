import {
	ThemeRules,
	ThemeSpec,
	Theme,
	ThemeRegistry,
	ThemeOverride,
	AllThemes,
	GetThemeFromDescriptor,
} from './theme.types';

import {
	convertThemeRulesToCSSRules,
	convertCSSRulesToCSSClasses,
	convertCSSClassesToThemeClasses,
	createToStringCode,
} from './theme.convert';

import { ThemeStyler } from './theme.styler';

import { DescriptorWithMeta, Predicate } from '../core.types';
import { EnvContextEntry } from '../env/env.types';
import { createEnvContextProvider, getEnvContext, getActiveEnvScope } from '../env/env';
import { createDescriptorOverride, createDescriptorOverrideIndex } from '../core';


export function createThemeRegistryFor<
	D extends DescriptorWithMeta<any, any>
>(
	_: D,
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
	Object.entries(classes['elements']).forEach(([name, classes]: [string, object]) => {
		createToStringCode(toStringCode, name, classes);
	});

	const classNames = Function(`
		${toStringCode.join('\n')}
		return '';
	`);

	function _for(name: string) {
		const store = this.store;

		if (store === null || store.hasOwnProperty(name)) {
			const style = new ThemeStyler(
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

export function useTheme<
	D extends DescriptorWithMeta<string, {theme?: Theme<any>}>,
	T extends Theme<any> = NonNullable<D['meta']['theme']>,
>(
	descriptor: D,
	props: {theme?: T},
	ctx: EnvContextEntry | null,
): T {
	let theme = props.theme;

	if (theme == null) {
		theme = nullTheme as T;

		if (ctx === null) {
			ctx = getEnvContext();
		}

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
		let {
			value:theme,
			xpath,
			predicate,
		} = list[i];
		const scope = getActiveEnvScope();
		let cursor = scope;

		XPATH: for (let x = 0, xn = xpath.length; x < xn; x++) {
			const descr = xpath[x];

			while (cursor) {
				cursor = cursor.parent;

				if (cursor === null || cursor.ctx === ctx) {
					theme = null as any;
					break XPATH;
				}

				if (cursor.owner === descr) {
					break;
				}
			}
		}

		if (theme !== null && (predicate === null || (
			scope !== null
			&& scope.ctx !== null
			&& scope.ctx.props !== null
			&& predicate(scope.ctx.props)
		))) {
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

		overrides: !overrides ? null : createDescriptorOverrideIndex(overrides),
	};
}

export function createThemeOverrideFor<
	D extends DescriptorWithMeta<string, {theme?: Theme<any>}>
>(
	Target: D,
	specificPath: DescriptorWithMeta<string, object>[],
	predicate?: Predicate<D['meta']>,
): (
	theme: GetThemeFromDescriptor<D>,
) => ThemeOverride {
	return (theme) => ({
		...createDescriptorOverride(Target, specificPath, predicate),
		value: theme,
	});
}