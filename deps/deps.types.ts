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
	GetMeta,
} from '../core.types';

export type LikeComponent<P extends object> = (props: P) => JSX.Element;

export type Deps<T extends DepsDescriptor<any, any>> = FlattenObject<
	Cast<
		DepsInline<T['map']>,
		object
	>
> & Meta<T['map']>

export type DepsProps<T extends DescriptorWithMetaMap> = {
	[K in keyof T]?: LikeComponent<NonNullable<T[K]>['meta']>;
}

export type DepsInline<T extends DescriptorWithMetaMap> = CastIntersect<
	{
		[K in keyof T]: IsOptional<T[K]> extends true
			? { [X in K]?: LikeComponent<NonNullable<T[K]>['meta']> }
			: { [X in K]: LikeComponent<NonNullable<T[K]>['meta']> }
	}[keyof T],
	object
>

export type DepsInjection<T extends DescriptorWithMetaMap> = FlattenObject<AllDeps<T>>;

export type DepsDescriptor<
	D extends DescriptorWithMeta<any, any>,
	M extends DescriptorWithMetaMap,
> = {
	map: M;
	descriptor: D,
	use: (props: D['meta']) => DepsInline<M>;
}

export type DepsRegistry = {
	map: null | Map<string, Map<string, LikeComponent<any>>>;
}


// Получить все зависимости на основе: {deps?: Deps<any>}
export type AllDeps<T> = FlattenObject<
	Cast<
		FlattenDepsMap<
			GetMetaDeps<T>
		>,
		object
	>
>

// Получить привязанные к `deps` мета-данные
type GetMetaDeps<T> = T extends {deps?: infer D} ? GetMeta<D> : never;

// Преобразование из {LocalDepName: {DepId: LikeComponent<Props>}}
//                                  ⬇️️️️ ⬇️ ⬇️
//                        {DepId: LikeComponent<Props>}
type FlattenDepsMap<T extends DescriptorWithMetaMap> = ToIntersect<{
	[K in keyof T]: ConvertMetaDeps<NonNullable<T[K]>, IsOptional<T[K]>>;
}[keyof T]>;

// Преобразование дескриптора компонента в:
//   {DepIdX: LikeComponent<XProps>} | {DepIdY: LikeComponent<YProps>} | ETC
type ConvertMetaDeps<
	T extends DescriptorWithMeta<string, object>,
	OPTIONAL extends boolean,
> = (
	OPTIONAL extends true
		? { [ID in T['id']]?: LikeComponent<T['meta']> }
		: { [ID in T['id']]: LikeComponent<T['meta']> }
) | (
	HasDepsMap<T['meta']> extends true ? AllDeps<T['meta']> : never
);

type HasDepsMap<T> = T extends {deps?: DescriptorWithMetaMap} ? true : false;
