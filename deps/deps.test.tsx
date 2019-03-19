import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Deps } from './deps.types';
import { getDeps, DepsProvider, createDepsFor, createDepsRegistry } from './deps';

type IconProps = {
	name: string;
}

function BaseIcon(props: IconProps) {
	return <i className={props.name}/>
}

function EmIcon(props: IconProps) {
	return <em className={props.name}/>
}

function StrongIcon(props: IconProps) {
	return <strong className={props.name}/>
}

type ButtonProps = {
	iconName: string;

	deps?: Deps<{
		Icon: IconProps;
	}>;
}

function IconButton(props: ButtonProps) {
	const deps = getDeps(IconButton, props);
	const {
		Icon = BaseIcon,
	} = deps;

	return (
		<button>
			<Icon name={props.iconName}/>
		</button>
	);
}

const root = document.createElement('div');

function render(fragment: JSX.Element) {
	ReactDOM.render(fragment, root,);
	return root.innerHTML;
}

it('deps: defaults', () => {
	expect(render(<IconButton iconName="ok" />)).toMatchSnapshot();
});

it('deps: inline', () => {
	expect(render(<IconButton iconName="inline" deps={{Icon: EmIcon}} />)).toMatchSnapshot();
});

it('deps: context', () => {
	const emDeps = createDepsFor(IconButton)({Icon: EmIcon});
	const strongDeps = createDepsFor(IconButton)({Icon: StrongIcon});

	expect(render(
		<DepsProvider value={createDepsRegistry([emDeps])}>
			<DepsProvider value={createDepsRegistry([strongDeps])}>
				<IconButton iconName="context" />{'\n'}
			</DepsProvider>

			<IconButton iconName="context" />
		</DepsProvider>
	)).toMatchSnapshot();
});