import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Deps } from './deps.types';
import { createDepsDescriptorFor, createDepsInjectionFor, createDepsInjectionForAll } from './deps';
import { createDescriptor } from '../core';

const $icon = createDescriptor('@truekit/core/deps: icon').withMeta<IconProps>();
const $button = createDescriptor('@truekit/core/deps: button').withMeta<ButtonProps>();
const $input = createDescriptor('@truekit/core/deps: input').withMeta<InputProps>();
const $form = createDescriptor('@truekit/core/deps: form').withMeta<FormProps>();

const $buttonDeps = createDepsDescriptorFor($button, {
	Icon: $icon.optional(),
});

const $formDeps = createDepsDescriptorFor($form, {
	Input: $input,
	Button: $button,
	Icon: $icon.optional(),
});

type IconProps = {
	name: string;
}

type ButtonProps = {
	iconName: string;
	deps?: Deps<typeof $buttonDeps>;
}

type InputProps = {
	type: 'text' | 'password';
}

type FormProps = {
	action: string;
	deps?: Deps<typeof $formDeps>;
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

function IconButton(props: ButtonProps) {
	const {Icon = BaseIcon} = $buttonDeps.use(props);
	return <button><Icon name={props.iconName}/></button>;
}

function Form(props: FormProps) {
	const deps = $formDeps.use(props)
	const {Icon = BaseIcon, Button, Input} = deps;
	return <form action={props.action}>
		<Input type="text"/>
		<Icon name="ok"/>
		<Button iconName="send"/>
	</form>;
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

xit('deps: context', () => {
	const emDeps = createDepsInjectionFor($buttonDeps, {[$icon.id]: EmIcon});
	const strongDeps = createDepsInjectionForAll($buttonDeps, {[$icon.id]: StrongIcon});

	// expect(render(
	// 	<DepsProvider value={createDepsRegistry([emDeps])}>
	// 		<DepsProvider value={createDepsRegistry([strongDeps])}>
	// 			<IconButton iconName="context" />{'\n'}
	// 		</DepsProvider>

	// 		<IconButton iconName="context" />
	// 	</DepsProvider>
	// )).toMatchSnapshot();
});