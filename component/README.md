@truekit/core: component
------------------------
Всё ниже перечисленое очень и очень мутный черновик, в особенности всё что связанно ср `state`.

```tsx
// LoginForm.types.ts
import { Theme, createComponentDescriptor } from '@truekit/core';

export const $LoginForm = createComponentDescriptor(
	'@MyApp/LoginForm',
	{} as LoginFormProps,
	{
		Input: $Input,
		Button: $Button,
		Icon: $Icon.optional(),
	},
);

export type LoginFormProps = {
	action: string;
	deps?: Deps<typeof $LoginForm.deps>;
	theme?: Theme<{...}>;
	state?: State<typeof defaultState>;
	header: SlotProp<SlotContent>;
	content: SlotProp<SlotContent>;
	license: Slot<(value: {agree: boolean; confirm: () => void}) => SlotContent>;
}

// LoginForm.tsx
import { jsx, createComponent } from '@truekit/core/component';
import { $LoginForm } from './LoginForm.types';


export const LoginState = createState(
	// Scheme & defaults
	() => ({
		agree: [true, null],
	}),

	// Mutations
	{
		confirm: ({agree}) => ({agree: !agree}),
	},
);


export const LoginForm = $LoginForm.createComponent(
	{
		defaultState,
	},
	(
		jsx,
		{action}, // Props
		{theme, Slot, state}, // Env
		{Icon}, // Deps
	) => {
		const hostTheme = theme.for('host').set('type', type);

		return jsx('form', hostTheme.toDOMProps({action}), <>
			<Slot name="header"/>
			<Slot name="content"><span className={theme.for('value')}>{value}</span></Slot>
			<Slot name="license" value={{
				agree: state.agree,
				confirm: state.$.confirm,
			}}>{({agree, confirm}) => (
				<input type="checkbox" checked={agree} onChange={confirm}/>
			)}</Slot>
		</>);
	},
);

<LoginForm
	header={<h2>bla-bla</h2>}
	content={null}
	license={(parent, value) => <>
		{parent(value)}
		<br/>
		И ещё вы соглашатесь на боль.
	</>}
/>


// Usage
import { createDepsRegistry, createThemeRegistry } from '@truekit/cor';
import { $Icon, Icon } from './components/Icon';
import { $LoginForm, LoginForm } from './components/LoginForm';

const depsInjection = $LoginForm.createDeps({
	[$Icon.id]: Icon,
});

const themesInjection = $LoginForm.createTheme({
	host: {},
	elements: {},
}, {
	[$Icon.id]: $Icon.createTheme({
		host: {},
		elements: {},
	}),
});

ReactDOM.render(
	<DepsPropvider value={createDepsRegistry([depsInjection])}>
		<ThemePropvider value={createThemeRegistry([themesInjection])}>
			<LoginForm action="/login" />
		</ThemePropvider>
	</DepsPropvider>,
	document.getElementById('root'),
);
```


----


### Examples

#### Counter

```tsx
export const CounterState = createState(
	// Initial State
	() => ({
		value: 0
	}),

	// Mutations
	{
		reset: () => ({value: 0}),
		increment: (state) => ({value: state().value + 1}),
		decrement: (state) => ({value: state().value - 1}),

		asyncRandom: (state, transation) =>
			transation(() => new Promise(resolve => {
				setTimeout(() => resolve({
					value: state().value % 10,
				}), 1500);
			}))
			.then(() => {
				console.log('Транзакция прошла успешно');
			})
			.catch((reason) => {
				console.log('Состояние мутируемых полей изменилось, либо просто fail');
				throw reason;
			})
		,
	},

	// Reactions
	[
		navState.reaction('navigate', ($, payload) => $.reset()),
	],
);

export const Counter = $Counter.createComponent(
	{
		defaultState: CounterState,
	},
	(jsx, {}, {theme, state}) => (
		jsx('div', theme.for('host').toDOMProps(), <>
			<button onClick={handle(state.$.increment)}>+</bitton>
			<span>{state.value}</span>
			<button onClick={handle(state.$.decrement)}>-</bitton>
			<button onClick={handle(state.$.asyncRandom)}>rnd</bitton>

			{state.$$.is('pending') && 'идёт транзакция'}
			{state.$$.is('failed') && 'транзакция сломалась, попробуйте ещё раз'}
			{state.$$.is('ok') && 'транзакция завершилась успехом'}
		</>);
	),
);
```