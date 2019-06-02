import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
	createThemeFor,
	getTheme,
	createThemeRegistry,
	ThemeProvider,
	createThemeOverrideFor,
	createThemeRegistryFor,
} from './theme';
import { resetCSS } from '@artifact-project/css';
import { Theme } from './theme.types';
import { withEnvScope } from '../env/env';
import { createDescriptor } from '../core';
import { createDepsDescriptorFor, Deps } from '../deps';
// import * as classnames from 'classnames';
// import { now } from '@perf-tools/performance';

const $text = createDescriptor('@truekit/core/theme: Text').withMeta<TextProps>();
const $icon = createDescriptor('@truekit/core/theme: Icon').withMeta<IconProps>();
const $btn = createDescriptor('@truekit/core/theme: Btn').withMeta<BtnProps>();

const $btnDeps = createDepsDescriptorFor($btn, {
	[$text.id]: $text,
	[$icon.id]: $icon.optional(),
});

type TextProps = {
	children?: React.ReactNode;
	size?: 'big' | 'small';
	block?: boolean;
	type?: 'default' | 'error';
	disabled?: boolean;
	theme?: Theme<{
		host: Pick<TextProps, 'size' | 'disabled' | 'block' | 'type'> & {
			multiline: 'on' | 'off';
		};
		elements: {
			value: boolean;
		};
	}>;
}

type IconProps = {
	size?: 'big' | 'small';
	theme?: Theme<{
		host: Pick<IconProps, 'size'>;
		elements: {};
	}>;
}

type BtnProps = {
	value?: string;
	deps?: Deps<typeof $btnDeps>;
	theme?: Theme<{
		host: {};
		elements: {};
	}>;
}

function Text(props: TextProps) {
	return withEnvScope($text, null, () => {
		const hostTheme = getTheme($text, props).for('host');
		const result = <div className={hostTheme}>{props.children}</div>;

		props.size && hostTheme.set('size', props.size);
		props.disabled && hostTheme.set('disabled', true);

		return result;
	});
}

function Icon(props: IconProps) {
	return withEnvScope($icon, {props, deps: null, depsInjection: null, theme: null}, () => {
		const hostTheme = getTheme($icon, props).for('host');
		const result = <i className={hostTheme}/>;

		props.size && hostTheme.set('size', props.size);

		return result;
	});
}

function Btn(props: BtnProps) {
	return withEnvScope($btn, null, () => {
		const hostTheme = getTheme($btn, props).for('host');
		return <button className={hostTheme}><Icon/><Text>{props.value}</Text></button>;
	});
}

beforeEach(() => {
	process.env.NODE_ENV = 'production';
	resetCSS(0);
});

describe('createThemeFor', () => {
	it('host', () => {
		const theme = createThemeFor($text, {
			host: {color: '#333'},
			elements: {},
		});

		expect(theme.descriptor).toBe($text);
		expect(theme.cssRules).toEqual({
			'.host': {color: '#333'},
		});
		expect(theme.classes).toEqual({
			host: {$root: '_0'},
			elements: {},
		});
		expect(theme.for('host').toString()).toBe('_0');
	});

	it('for equal for (but not persist)', () => {
		const theme = createThemeFor($text, {
			host: {color: '#333'},
			elements: {},
		});
		const host1 = theme.for('host');
		const host2 = theme.for('host');

		expect(host1).not.toBe(host2);
		expect(host1 + '').toBe(host2 + '');
	});

	// Создаёт тему у которой метод `for` будет вовращать костантное значение
	it('persist', () => {
		const theme = createThemeFor($text, {
			host: {color: '#333'},
			elements: {},
		}).persist({});
		const host1 = theme.for('host');
		const host2 = theme.for('host');

		expect(host1).toBe(host2);
		expect(host1 + '').toBe(host2 + '');
	});

	it('host - element', () => {
		const theme = createThemeFor($text, {
			host: {color: '#333'},
			elements: {value: {color: 'red'}},
		});

		expect(theme.cssRules).toEqual({
			'.host': {color: '#333'},
			'.elements--value': {color: 'red'},
		});
		expect(theme.classes).toEqual({
			host: {$root: '_0'},
			elements: {value: '_1'},
		});
		expect(theme.for('value').toString()).toBe('_1');
	});

	it('host - modifiers', () => {
		const theme = createThemeFor($text, {
			host: {
				color: '#333',
				':modifiers': {
					size: {
						':self': {fontSize: '100%'},
						big: {fontSize: '200%'},
						small: {fontSize: '50%'},
					},
					disabled: {
						opacity: .5,
					},
				},
			},
			elements: {},
		});

		expect(theme.cssRules).toEqual({
			'.host': {color: '#333'},
			'.host--size': {fontSize: '100%'},
			'.host--size--big': {fontSize: '200%'},
			'.host--size--small': {fontSize: '50%'},
			'.host--disabled': {opacity: .5},
		});

		expect(theme.classes).toEqual({
			host: {
				$root: '_0',
				size: {$root: '_1', big: '_2', small: '_3'},
				disabled: '_4',
			},
			elements: {},
		});
		expect(theme.for('host').toString()).toBe('_0');
		expect(theme.for('host').set('size', 'small').toString()).toBe('_0 _1 _3');
		expect(theme.for('host').set('size', 'big').toString()).toBe('_0 _1 _2');
		expect(theme.for('host').set('disabled', true).toString()).toBe('_0 _4');
		expect(theme.for('host').set('size', 'small').set('disabled', true).toString()).toBe('_0 _1 _3 _4');
	});

	it('host + &', () => {
		const theme = createThemeFor($text, {
			host: {
				color: '#333',
				'+': {
					'&': {
						marginLeft: 5,
						'+': {
							':not': {
								'&': {
									marginLeft: 10,
									'+': {'&': {marginLeft: 15}},
									':not': {
										':first-child': {
											marginLeft: 0,
										},
									},
								},
							},
						},
					},
				},
			},
			elements: {},
		});

		expect(theme.cssRules).toEqual({
			'.host': {color: '#333'},
			'.host + .host': {marginLeft: 5},
			'.host + .host + :not(.host)': {marginLeft: 10},
			'.host + .host + :not(.host) + .host': {marginLeft: 15},
			'.host + .host + :not(.host):not(:first-child)': {marginLeft: 0},
		});

		expect(theme.classes).toEqual({
			host: {$root: '_0'},
			elements: {},
		});
	});

	it('host - modifiers - not', () => {
		const theme = createThemeFor($text, {
			host: {
				color: '#333',
				':modifiers': {
					block: {
						width: '100%',
						':not': {
							multiline: {on: {wordBreak: 'normal', whiteSpace: 'nowrap'}},
						},
					},
					multiline: {off: {wordBreak: 'normal', whiteSpace: 'nowrap'}},
					type: {
						':self': {fontWeight: 'normal'},
						default: {fontSize: '100%'},
						error: {color: 'red'},
					},
				},
			},
			elements: {},
		});

		expect(theme.cssRules).toEqual({
			'.host': {color: '#333'},
			'.host--block': {width: '100%'},
			'.host--block:not(.host--multiline--on)': {wordBreak: 'normal', whiteSpace: 'nowrap'},
			'.host--multiline--off': {wordBreak: 'normal', whiteSpace: 'nowrap'},
			'.host--type': {fontWeight: 'normal'},
			'.host--type--default': {fontSize: '100%'},
			'.host--type--error': {color: 'red'},
		});

		expect(theme.classes).toEqual({
			host: {
				$root: '_0',
				block: '_1',
				multiline: {
					on: '_2',
					off: '_3',
				},
				type: {
					$root: '_4',
					default: '_5',
					error: '_6',
				},
			},
			elements: {},
		});
	});
});

const root = document.createElement('div');

function render(fragment: JSX.Element) {
	ReactDOM.render(fragment, root,);
	return root.innerHTML;
}

describe('react', () => {
	it('inline theme', () => {
		const theme = createThemeFor($text, {
			host: {
				color: 'red',
				':modifiers': {
					size: {small: {fontSize: '50%'}},
				},
			},
			elements: {},
		});

		expect(render(
			<Text theme={theme} size="small">Wow!</Text>,
		)).toMatchSnapshot();
	});

	it('without (context & inline)', () => {
		expect(render(
			<Text>Wow!</Text>,
		)).toMatchSnapshot();
	});

	it('with context', () => {
		const rootTheme = createThemeRegistry([
			createThemeFor($icon, {
				host: {
					display: 'inline-block',
					':modifiers': {
						size: {big: {fontSize: 300}},
					},
				},
				elements: {},
			}),
		]);

		const theme = createThemeRegistry([
			createThemeFor($text, {
				host: {
					color: '#333',
					':modifiers': {
						disabled: {color: 'red'},
					},
				},
				elements: {},
			}),
		]);

		expect(render(
			<ThemeProvider value={rootTheme}>
				<ThemeProvider value={theme}>
					<Text disabled>Wow!</Text>
					<Icon size="big"/>
				</ThemeProvider>,
			</ThemeProvider>,
		)).toMatchSnapshot();
	});

	it('createThemeRegistryFor', () => {
		const iconTheme = createThemeFor($icon, {
			host: {color: 'red'},
			elements: {},
		});
		const btnTheme = createThemeFor($btn, {
			host: {color: 'green'},
			elements: {},
		});
		const textTheme = createThemeFor($text, {
			host: {color: 'blue'},
			elements: {},
		});
		const rootTheme = createThemeRegistryFor($btn, {
			[$btn.id]: btnTheme,
			[$text.id]: textTheme,
			[$icon.id]: iconTheme,
		});

		expect(render(
			<ThemeProvider value={rootTheme}>
				<Btn value="ok"/>
			</ThemeProvider>
		)).toMatchSnapshot();
	});
});

describe('overrides', () => {
	it('createThemeOverrideFor', () => {
		const textTheme = createThemeFor($text, {
			host: {color: '#333'},
			elements: {},
		});
		const iconTheme = createThemeFor($icon, {
			host: {color: 'black'},
			elements: {},
		});
		const redIconTheme = createThemeFor($icon, {
			host: {color: 'red'},
			elements: {},
		});
		const blueIconTheme = createThemeFor($icon, {
			host: {color: 'blue'},
			elements: {},
		});
		const purpleIconTheme = createThemeFor($icon, {
			host: {color: 'purple'},
			elements: {},
		});
		const rootTheme = createThemeRegistry([textTheme, iconTheme]);
		const redTheme = createThemeRegistry(null, [
			createThemeOverrideFor($icon, [$text, $text])(purpleIconTheme),
			createThemeOverrideFor($icon, [$text])(redIconTheme),
		]);
		const blueTheme = createThemeRegistry(null, [
			createThemeOverrideFor($icon, [$text])(blueIconTheme),
		]);
		const icon = <Icon size="small"/>;

		expect(render(
			<ThemeProvider value={rootTheme}>
				<ThemeProvider value={redTheme}>
					<Text>{'\n'}
						{'\t'}red: <Icon size="small"/>{'\n'}
					</Text>{'\n'}

					<Text>{'\n'}
						<ThemeProvider value={blueTheme}>
							{'\t'}red: {icon}{'\n'}
							{'\t'}<Text>{'\n'}
								{'\t\t'}blue: {icon}{'\n'}
							{'\t'}</Text>{'\n'}
						</ThemeProvider>
						{'\t'}<Text>{'\n'}
							{'\t\t'}purple: {icon}{'\n'}
						{'\t'}</Text>{'\n'}
					</Text>{'\n'}

					black: <Icon size="small"/>{'\n'}
				</ThemeProvider>

				black: <Icon size="small"/>
			</ThemeProvider>,
		)).toMatchSnapshot();
	});

	it('createThemeOverrideFor with predicate', () => {
		const redIconTheme = createThemeFor($icon, {
			host: {color: 'red'},
			elements: {},
		});
		const purpleIconTheme = createThemeFor($icon, {
			host: {color: 'purple'},
			elements: {},
		});
		const overrideTheme = createThemeRegistry(null, [
			createThemeOverrideFor($icon, [])(purpleIconTheme, {size: 'big'}),
			createThemeOverrideFor($icon, [])(redIconTheme),
		]);

		expect(render(
			<ThemeProvider value={overrideTheme}>
				{'\t'}red: <Icon size="small"/>{'\n'}
				{'\t'}purpleIconTheme: <Icon size="big"/>{'\n'}
			</ThemeProvider>
		)).toMatchSnapshot();
	});
});

// it('performance', () => {
// 	type TestProps = {
// 		theme?: Theme<{
// 			primary: boolean;
// 			warning: boolean;
// 			danger: boolean;
// 			fluid: boolean;
// 			large: boolean;
// 			flat: boolean;
// 			disabled: boolean;
// 			mobile: boolean;
// 			auto: boolean;
// 			icon: boolean;
// 		}>;
// 	};
// 	const cssRule = {color: 'inherit'};
// 	const TestCmp = (_: TestProps) => <div/>;
// 	const theme = createThemeFor(TestCmp)({
// 		':host': cssRule,
// 		primary: cssRule,
// 		warning: cssRule,
// 		danger: cssRule,
// 		fluid: cssRule,
// 		large: cssRule,
// 		flat: cssRule,
// 		disabled: cssRule,
// 		mobile: cssRule,
// 		auto: cssRule,
// 		icon: cssRule,
// 	});
// 	const maxIter = 1e3;
// 	const classes = {
// 			base: theme.classes[':host'],
// 			...theme.classes,
// 	};
// 	const states = Array.from({length: maxIter}).map(() => ({
// 			primary: Math.random() > .5,
// 			warning: Math.random() > .5,
// 			danger: Math.random() > .5,
// 			fluid: Math.random() > .5,
// 			large: Math.random() > .5,
// 			flat: Math.random() > .5,
// 			disabled: Math.random() > .5,
// 			mobile: Math.random() > .5,
// 			auto: Math.random() > .5,
// 			icon: Math.random() > .5,
// 	}));
// 	const pkgCSSTheme = [];
// 	const pkgClassNames = [];

// 	// pkg: classnames
// 	let pkgClassNamesTime = -now();
// 	for (let i = 0; i < maxIter; i++) {
// 		const s = states[i];
// 		const c = classes;
// 		pkgClassNames.push(classnames(
// 			c.base,
// 			{
// 				[c.primary]: s.primary,
// 				[c.warning]: s.warning,
// 				[c.danger]: s.danger,
// 				[c.fluid]: s.fluid,
// 				[c.large]: s.large,
// 				[c.flat]: s.flat,
// 				[c.disabled]: s.disabled,
// 				[c.mobile]: s.mobile,
// 				[c.auto]: s.auto,
// 				[c.icon]: s.icon,
// 			},
// 		));
// 	}
// 	pkgClassNamesTime += now();

// 	// pkg: css/theme
// 	let pkgCSSThemeTime = -now();
// 	for (let i = 0; i < maxIter; i++) {
// 		const s = states[i];
// 		const style = theme.create();

// 		style.set('primary', s.primary);
// 		style.set('warning', s.warning);
// 		style.set('danger', s.danger);
// 		style.set('fluid', s.fluid);
// 		style.set('large', s.large);
// 		style.set('flat', s.flat);
// 		style.set('disabled', s.disabled);
// 		style.set('mobile', s.mobile);
// 		style.set('auto', s.auto);
// 		style.set('icon', s.icon);

// 		pkgCSSTheme.push(style.toString());
// 	}
// 	pkgCSSThemeTime += now();

// 	expect(pkgCSSTheme).toEqual(pkgClassNames);
// 	expect(pkgCSSThemeTime).toBeLessThan(pkgClassNamesTime);
// });