import {
	createElement,
} from 'react';
import {
	DescriptorWithMeta,
	DescriptorWithMetaMap,
	LikeFragment,
	LikeComponent,
	ToIntersect,
	CleanObject,
} from '../core.types';
import {
	DepsDescriptor,
	DepsMap,
	DepsMapBy,
} from '../deps';
import {
	Theme,
	ThemeRules,
} from '../theme/theme.types';

export interface ComponentDescriptor<
	N extends string,
	P extends object,
	DM extends DescriptorWithMetaMap,
> extends DescriptorWithMeta<N, P> {
	deps: DepsDescriptor<this, DM>;
	props: P;

	createComponent(render: ComponentRender<this>): LikeComponent<this['meta']>;
	createTheme<TS extends GetThemeSpec<P>>(rules: ThemeRules<TS>): Theme<TS>;
	createDeps(deps: Partial<DepsMapBy<DM>>): DepsMap
	createStrictDeps(deps: DepsMapBy<DM>): DepsMap;
}

type GetTheme<P> = P extends {theme?: infer P} ? P : never;
type GetThemeSpec<P> = P extends {theme?: Theme<infer TS>} ? TS : never;
type GetDeps<P> = P extends {deps?: infer D} ? D : never;

export type SlotProp<S extends SlotPropType> = null | (S extends (value: infer V) => infer R
	? SlotWithValue<S, V, R> | R
	: SlotWithoutValue<S> | S
)

type SlotWithValue<S extends SlotPropType, V, R> = (parent: S, value: V) => R
type SlotWithoutValue<S extends SlotPropType> = (parent: S) => S

type SlotPropTypeInfer<P> =
	P extends SlotWithValue<infer T, any, any> ? T :
	P extends SlotWithoutValue<infer T> ? T :
	never

export type GetSlotsSpec<P extends object> = CleanObject<{
	[K in keyof P]-?: SlotPropTypeInfer<ToIntersect<P[K]>>;
}>

type SlotComponentProps<N, T> = (
	N extends 'children'
		? {name?: 'default'}
		: {name: N}
) & (
	T extends (value: infer V) => any
		? {value: V; children?: T; } // <Slot name="..." value="...">{(value) => ...}</Slot>
		: {children?: T;} // <Slot name="...">...</Slot>
)

export type SlotComponent<S extends object> = (
	(props: {
		[N in keyof S]: SlotComponentProps<N, S[N]>;
	}[keyof S]) => LikeFragment
);

export type ComponentRender<D extends ComponentDescriptor<any, any, any>> = (
	jsx: typeof createElement,
	props: D['meta'],
	env: {
		theme: GetTheme<D['meta']>;
		Slot: SlotComponent<GetSlotsSpec<D['meta']>>;
	},
	deps: GetDeps<D['meta']>,
) => LikeFragment;

type SlotValue = number | string | JSX.Element;
export type SlotContent = SlotValue | SlotValue[];
export type SlotPropType = SlotContent | ((value: object) => SlotContent);