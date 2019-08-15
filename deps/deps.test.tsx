import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
	Deps, DepsInline,
} from './deps.types';
import {
	createDepsDescriptor,
	createDepsRegistry,
	DepsProvider,
	createDepsBy,
	createStrictDepsBy,
} from './deps';
import { createDescriptor } from '../core';
import { withEnvScope } from '../env/env';

const $icon = createDescriptor('@truekit/core/deps: icon').withMeta<IconProps>();
const $button = createDescriptor('@truekit/core/deps: button').withMeta<ButtonProps>();
const $input = createDescriptor('@truekit/core/deps: input').withMeta<InputProps>();
const $form = createDescriptor('@truekit/core/deps: form').withMeta<FormProps>();

const $buttonDeps = createDepsDescriptor($button, {
	Icon: $icon.optional(),
});

const $formDeps = createDepsDescriptor($form, {
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

type GetD<T> = T extends {deps?: infer D}
	? D extends Deps<infer DD> ? DD['map'] : never
	: never;
type Foo1 = GetD<FormProps>;

function BaseIcon(props: IconProps) {
	return withEnvScope({}, null, () => <i className={props.name}/>);
}

function EmIcon(props: IconProps) {
	return withEnvScope({}, null, () => <em className={props.name}/>);
}

function StrongIcon(props: IconProps) {
	return withEnvScope({}, null, () => <strong className={props.name}/>);
}

function IconButton(props: ButtonProps) {
	return withEnvScope({}, null, () => {
		const {Icon = BaseIcon} = $buttonDeps.use(props, null);
		return <button><Icon name={props.iconName}/></button>;
	});
}

function Input(props: InputProps) {
	return withEnvScope({}, null, () => <input type={props.type}/>);
}

function Form(props: FormProps) {
	return withEnvScope({}, null, () => {
		const deps = $formDeps.use(props, null);
		const {Icon = BaseIcon, Button, Input} = deps;

		return <>
			<form action={props.action}>{'\n'}
				{'\t'}<Input type="text"/>{'\n'}
				{'\t'}<Icon name="ok"/>{'\n'}
				{'\t'}<Button iconName="DONE"/>{'\n'}
			</form>{'\n'}
		</>;
	});
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
	const emptyInj = createDepsBy($buttonDeps, {});
	const emInj = createDepsBy($buttonDeps, {[$icon.id]: EmIcon});
	const strongInj = createStrictDepsBy($buttonDeps, {[$icon.id]: StrongIcon});

	expect(render(
		<DepsProvider value={createDepsRegistry([emInj])}>
			<DepsProvider value={createDepsRegistry([strongInj])}>
				<IconButton iconName="ctx: strong" />{'\n'}
			</DepsProvider>

			<DepsProvider value={createDepsRegistry([emptyInj])}>
				<IconButton iconName="ctx: em1" />{'\n'}
			</DepsProvider>

			<IconButton iconName="ctx: em2" />
		</DepsProvider>
	)).toMatchSnapshot();
});

it('deps: fail', () => {
	expect(render(<Form action="/send"/>)).toMatchSnapshot();
});

it('deps: form', () => {
	const formInj = createStrictDepsBy($formDeps, {
		[$button.id]: IconButton,
		[$input.id]: Input,
		[$icon.id]: StrongIcon,
	});

	expect(render(
		<DepsProvider value={createDepsRegistry([formInj])}>
			<IconButton iconName="STRONG, yep" />{'\n'}
			<Form action="/send"/>
		</DepsProvider>
	)).toMatchSnapshot();
});

it('deps: btn + form', () => {
	const emBtnInj = createDepsBy($buttonDeps, {[$icon.id]: EmIcon});
	const formInj = createStrictDepsBy($formDeps, {
		[$button.id]: IconButton,
		[$input.id]: Input,
		[$icon.id]: StrongIcon,
	});

	expect(render(
		<DepsProvider value={createDepsRegistry([emBtnInj, formInj])}>
			<IconButton iconName="STRONG, yep" />{'\n'}
			<Form action="/send"/>
		</DepsProvider>
	)).toMatchSnapshot();
});
