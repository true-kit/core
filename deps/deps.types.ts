import {
	DescriptorWithMetaMap,
	UnionToIntersection,
	OptionalObject,
	IsOptional,
	FlattenDescriptorWithMetaMap,
	Cast,
} from '../core.types';

export type LikeComponent<P extends object> = (props: P) => JSX.Element;

export type Deps<T extends DepsDescriptor<any, any>> = DepsExport<T['value']>

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
	T extends DescriptorWithMetaMap,
	P extends {deps?: DepsProps<T>},
> = {
	value: T;
	use: (props: P) => DepsExport<T>;
};