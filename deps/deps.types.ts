import {
	DescriptorWithMetaMap,
	IsOptional,
	DescriptorWithMeta,
	FlattenObject,
	Meta,
	ToIntersect,
	GetMeta,
	DescriptorOverride,
	DescriptorOverrideIndex,
	LikeComponent,
} from '../core.types';
import { EnvContextEntry } from '../env/env.types';

export type Deps<T extends DepsDescriptor<any, any>> = (
	& FlattenObject< DepsInline<T['map']> >
	& Meta<T['map']>
)

export type DepsProps<T extends DescriptorWithMetaMap> = {
	[K in keyof T]?: LikeComponent<NonNullable<T[K]>['meta']>;
}

export type DepsInline<T extends DescriptorWithMetaMap> = ToIntersect<
	{
		[K in keyof T]: IsOptional<T[K]> extends true
			? { [X in K]?: LikeComponent<NonNullable<T[K]>['meta']> }
			: { [X in K]: LikeComponent<NonNullable<T[K]>['meta']> }
	}[keyof T]
>

export type DepsMapBy<T extends DescriptorWithMetaMap> = FlattenObject<AllDeps<T>>;

export type DepsMap = {
	[depId: string]: LikeComponent<any>;
}

export type DepsDescriptor<
	D extends DescriptorWithMeta<any, any>,
	M extends DescriptorWithMetaMap,
> = {
	map: M;
	descriptor: D,
	use: (
		props: D['meta'],
		ctx: EnvContextEntry | null,
	) => DepsInline<M>;
}

export type DepOverride = DescriptorOverride & {
	value: LikeComponent<any>;
}

export type DepsRegistry = {
	map: null | DepsMap;
	overrides: null | DescriptorOverrideIndex<DepOverride>;
}

// Получить все зависимости на основе: {deps?: Deps<any>}
export type AllDeps<T extends DescriptorWithMetaMap> = FlattenDepsMap<T>

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
	HasDepsMap<T['meta']> extends true ? AllDeps<GetMetaDeps<T['meta']>> : never
);

type HasDepsMap<T> = T extends {deps?: DescriptorWithMetaMap} ? true : false;
