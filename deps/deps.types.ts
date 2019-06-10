import {
	DescriptorWithMetaMap,
	OptionalObject,
	IsOptional,
	Cast,
	DescriptorWithMeta,
	FlattenObject,
	Meta,
	CastIntersect,
	ToIntersect,
} from '../core.types';

export type LikeComponent<P extends object> = (props: P) => JSX.Element;

export type Deps<T extends DepsDescriptor<any, any>> = FlattenObject<DepsExport<T['map']> & Meta<T['map']>>

export type DepsProps<T extends DescriptorWithMetaMap> = {
	[K in keyof T]?: LikeComponent<NonNullable<T[K]>['meta']>;
}

export type DepsExport<T extends DescriptorWithMetaMap> = OptionalObject<
	CastIntersect<
		{
			[K in keyof T]: IsOptional<T[K]> extends true
				? { [X in K]?: LikeComponent<NonNullable<T[K]>['meta']> }
				: { [X in K]: LikeComponent<NonNullable<T[K]>['meta']> }
		}[keyof T],
		object
	>
>;

type ToLikeComponents<T extends object> = {
	[K in keyof T]: LikeComponent<Cast<T[K], object>>;
}

export type DepsInjection<T extends DescriptorWithMetaMap> = ToLikeComponents<
	AllDeps<T, 'deps'>
>;

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
}

export type AllDeps<
	T extends DescriptorWithMetaMap,
	KEYS extends string,
> = FlattenObject<
	CastIntersect<
		AllDepsWalker<T, KEYS>,
		object
	>
>

type AllDepsWalker<
	T extends DescriptorWithMetaMap,
	KEYS extends string,
> = ToIntersect<{
	[K in keyof T]: AllDepsIterator<NonNullable<T[K]>, KEYS>;
}[keyof T]>

type AllDepsIterator<
	T extends DescriptorWithMeta<any, any>,
	KEYS extends string,
> = {
	[X in T['id']]: T['meta'];
} | {
	// Recursion
	next: {
		[X in KEYS]: AllDepsWalker<
			NonNullable<T['meta'][X]>,
			KEYS
		>;
	}[KEYS];
	exit: never;
}[T['meta'] extends {[X in KEYS]?: DescriptorWithMetaMap} ? 'next' : 'exit']
