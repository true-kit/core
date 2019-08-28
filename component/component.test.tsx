import * as React from 'react'; // @todo: Переехать на `jsx`
import * as ReactDOM from 'react-dom';

import { createComponentDescriptor } from './component';
import {
	Deps,
	DepsProvider,
	createDepsRegistry,
	createDeps,
	createDepOverride,
} from '../deps';
import { Theme } from '../theme';
import {
	createThemeRegistryFor,
	ThemeProvider,
	createThemeRegistry,
} from '../theme/theme';
import { resetCSS } from '@artifact-project/css';
import { SlotContent, SlotProp, SlotElement } from './component.types';

const $Icon = createComponentDescriptor('@truekit/core/cmp: Icon', {} as IconProps, {});
const $Btn = createComponentDescriptor('@truekit/core/cmp: Btn', {} as BtnProps, {
	Icon: $Icon,
});
const $Card = createComponentDescriptor('@truekit/core/cmp: Card', {} as CardProps, {});

type IconProps = {
	name: string;
	theme?: Theme<{
		host: {};
		elements: {};
	}>;
}

type BtnProps = {
	type: 'text' | 'password';
	value: string;
	theme?: Theme<{
		host: Pick<BtnProps, 'type'>;
		elements: {value: true};
	}>;
	deps?: Deps<typeof $Btn.deps>;
}

type CardProps = {
	children: SlotContent;
}

const Icon = $Icon.createComponent((jsx, {name}, {theme}) => {
	const hostTheme = theme.for('host');
	return jsx('i', hostTheme.toDOMProps(), <>{name}</>);
});

const EmIcon = $Icon.createComponent((jsx, {name}, {theme}) => {
	const hostTheme = theme.for('host');
	return jsx('em', hostTheme.toDOMProps(), <>{name}</>);
});

const StrongIcon = $Icon.createComponent((jsx, {name}, {theme}) => {
	const hostTheme = theme.for('host');
	return jsx('strong', hostTheme.toDOMProps(), <>{name}</>);
});

const SpanIcon = $Icon.createComponent((jsx, {name}, {theme}) => {
	const hostTheme = theme.for('host');
	return jsx('span', hostTheme.toDOMProps(), <>{name}</>);
});

const Btn = $Btn.createComponent((jsx, {type, value}, {theme}, {Icon}) => {
	const hostTheme = theme.for('host').set('type', type);

	return jsx('button', hostTheme.toDOMProps({type}), <>
		<Icon name="pic" />
		<span className={theme.for('value')}>{value}</span>
	</>);
});

const Card = $Card.createComponent((jsx, {children}, {}) => {
	return jsx('div', {}, children);
});

let btnTheme: NonNullable<BtnProps['theme']>;
let iconTheme: NonNullable<IconProps['theme']>;

beforeAll(() => {
	process.env.NODE_ENV = 'production';
	resetCSS(0);

	btnTheme = $Btn.createTheme({
		host: {color: 'black', ':modifiers': {type: {password: {color: 'red'}}}},
		elements: {value: {color: '#333'}},
	});

	iconTheme = $Icon.createTheme({
		host: {color: 'blue'},
		elements: {},
	});
});

describe('component', () => {
	it('Btn without theme and deps', () => {
		expect(render(<Btn type="password" value="foo" />)).toMatchSnapshot();
	});

	it('Btn with inline deps and without theme', () => {
		expect(render(<Btn
			deps={{Icon}}
			type="password"
			value="bar" />
		)).toMatchSnapshot();
	});

	it('Btn with inline deps and inline root theme', () => {
		expect(render(<Btn
			deps={{Icon}}
			theme={btnTheme}
			type="password"
			value="baz" />
		)).toMatchSnapshot();
	});

	it('Btn with all deps and themes', () => {
		const deps = $Btn.createStrictDeps({
			[$Icon.id]: Icon,
		});
		const allDeps = createDepsRegistry([deps]);
		const allThemes = createThemeRegistryFor($Btn, {
			[$Btn.id]: btnTheme,
			[$Icon.id]: iconTheme,
		});

		expect(render(
			<DepsProvider value={allDeps}>
				<ThemeProvider value={allThemes}>
					<Btn type="password" value="qux" />
				</ThemeProvider>
			</DepsProvider>
		)).toMatchSnapshot();
	});

	it('Btn with deps overrides', () => {
		const defaultDeps = createDeps({[$Icon.id]: Icon});
		const iconOver1 = createDepOverride($Icon, [$Card])(EmIcon);
		const iconOver2 = createDepOverride($Icon, [$Card], {name: 'over-2'})(StrongIcon);
		const iconOver3 = createDepOverride($Icon, [$Card, $Card])(SpanIcon);

		expect(render(
			<DepsProvider value={createDepsRegistry([defaultDeps], [iconOver1, iconOver2, iconOver3])}>
				<Icon name="default"/>{'\n'}
				<Card>{'\n\t'}
					<Icon name="over-1"/>{'\n\t'}
					<Card>{'\n\t\t'}
						<Icon name="over-2"/>{'\n\t\t'}
						<Icon name="over-3"/>{'\n\t'}
					</Card>{'\n'}
				</Card>
			</DepsProvider>
		)).toMatchSnapshot();
	});
});

describe('component slots', () => {
	type BlockProps = {
		children?: SlotProp<SlotContent>;
		theme?: Theme<{
			host: {},
			elements: {},
		}>;
		value?: string;
		data?: object;
		slotNum?: SlotProp<number>;
		slotStr?: SlotProp<string>;
		slotFragment?: SlotProp<SlotContent>;
		slotWithValue?: SlotProp<(value: {username:string}) => SlotContent>;
	}

	const $Block = createComponentDescriptor('@truekit/core/cmp: Block', {} as BlockProps);
	const Block = $Block.createComponent((jsx, {}, {Slot, theme}) => {
		return (
			<div className={theme.for('host')}>{'\n\t'}
				<Slot/>{'\n\t'}
				<div>num: <Slot name="slotNum">{123}</Slot></div>{'\n\t'}
				<div>val: <Slot name="slotStr">wow</Slot></div>{'\n\t'}
				<div>fragment: <Slot name="slotFragment"><b>bold</b>!</Slot></div>{'\n\t'}
				<div>{'\n\t\t'}
					callback:{'\n\t\t'}
					<Slot name="slotWithValue" value={{username: "RubaXa"}}>
						{({username}) => <h2>Hi, {username}!</h2>}
					</Slot>{'\n\t'}
				</div>{'\n'}
			</div>
		);
	});

	it('default slots', () => {
		expect(render(<Block/>)).toMatchSnapshot();
	});

	it('override num and str slot', () => {
		expect(render(<Block
			slotNum={321}
			slotStr={null}
		/>)).toMatchSnapshot();
	});

	it('override slot with parent', () => {
		expect(render(<Block
			slotNum={(parent) => parent * 2}
			slotWithValue={(parent, value) => <>{parent(value)}<br/>Yes, {value.username}.</>}
		/>)).toMatchSnapshot();
	});

	describe('slot with is', () => {
		const $WithIS = createComponentDescriptor('@truekit/core/cmp: WithIS', {} as {
			header?: SlotProp< SlotContent >;
			subHeader?: SlotProp< SlotContent >;
			subHeaderEl?: SlotElement;
			lastHeader?: SlotProp< SlotContent >;
			lastHeaderEl?: SlotElement;
		});
		const WithIS = $WithIS.createComponent((_, props, {Slot}) => <>
			<Slot name="header" is={ <h1/> }>Primary</Slot>{'\n'}
			<Slot name="subHeader" is={ props.subHeaderEl }>Sub</Slot>{'\n'}
			<Slot name="lastHeader" is={ [props.lastHeaderEl, <h4/>] }/>{'\n'}
		</>);

		it('defaults', () => {
			expect(render(<WithIS/>)).toMatchSnapshot();
		});

		it('header is null', () => {
			expect(render(<WithIS header={null}/>)).toMatchSnapshot();
		});

		it('header is undefined', () => {
			expect(render(<WithIS header={undefined}/>)).toMatchSnapshot();
		});

		it('subHeaderEl is h2', () => {
			expect(render(<WithIS subHeaderEl={<h2/>} />)).toMatchSnapshot();
		});

		it('subHeaderEl is h2 with override', () => {
			expect(render(<WithIS subHeader={<>Wow!</>} subHeaderEl={<h2/>} />)).toMatchSnapshot();
		});

		it('lastHeaderEl is h3', () => {
			expect(render(<WithIS lastHeaderEl={<h3/>} />)).toMatchSnapshot();
		});

		it('lastHeaderEl is null', () => {
			expect(render(<WithIS lastHeaderEl={null} />)).toMatchSnapshot();
		});

		it('lastHeaderEl is undefined', () => {
			expect(render(<WithIS lastHeaderEl={undefined} />)).toMatchSnapshot();
		});
	});

	it('slots with nested', () => {
		const redTheme = $Block.createTheme({
			host: {color: 'red'},
			elements: {},
		});
		const greenTheme = $Block.createTheme({
			host: {color: 'green'},
			elements: {},
		});
		const blueTheme = $Block.createTheme({
			host: {color: 'blue'},
			elements: {},
		});

		expect(render(
			<ThemeProvider value={createThemeRegistry([blueTheme])}>
				<Block slotNum={(parent) => parent * 2} theme={redTheme}>{'\n\t'}
					<Block slotNum={(parent) => parent * 3} slotWithValue={null} theme={greenTheme}/>{'\n\t'}
					---{'\n\t'}
					<Block slotNum={(parent) => parent * 4} slotWithValue={null}/>{'\n\t'}
				</Block>
			</ThemeProvider>
		)).toMatchSnapshot();
	});
});

const root = document.createElement('div');

function render(fragment: JSX.Element) {
	ReactDOM.render(fragment, root);
	return root.innerHTML;
}
