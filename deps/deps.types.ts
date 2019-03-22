import {
	DescriptorWithMetaMap,
	UnionToIntersection,
	OptionalObject,
	IsOptional,
	FlattenDescriptorWithMetaMap,
	Cast,
	DescriptorWithMeta,
	Descriptor,
} from '../core.types';

export type LikeComponent<P extends object> = (props: P) => JSX.Element;

export type Deps<T extends DepsDescriptor<any, any>> = DepsExport<T['map']>

export type DepsProps<T extends DescriptorWithMetaMap> = {
	[K in keyof T]?: LikeComponent<NonNullable<T[K]>['meta']>;
}

export type DepsExport<T extends DescriptorWithMetaMap> = OptionalObject<UnionToIntersection<{
	[K in keyof T]: IsOptional<T[K]> extends true
		? { [X in K]?: LikeComponent<NonNullable<T[K]>['meta']> }
		: { [X in K]: LikeComponent<NonNullable<T[K]>['meta']> }
}[keyof T]>>;

type ToLikeComponents<T extends object> = {
	[K in keyof T]: LikeComponent<Cast<T[K], object>>;
}

export type DepsInjection<T extends DescriptorWithMetaMap> =
	ToLikeComponents<FlattenDescriptorWithMetaMap<T, 'deps'>>;

export type DepsDescriptor<
	D extends DescriptorWithMeta<any, any>,
	M extends DescriptorWithMetaMap,
> = {
	map: M;
	descriptor: D,
	use: (props: D['meta']) => DepsExport<M>;
}

export type DepsRegistry = {
	map: null | Map<string, Map<string, LikeComponent<any>>>;
};