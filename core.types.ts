export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type ToIntersect<U> =
	(U extends any ? (inp: U) => void : never) extends ((out: infer I) => void)
		? I
		: never
;

export type CastIntersect<X, Y> = Cast<ToIntersect<X>, Y>;

export type ArrayInfer<T> = T extends (infer U)[] ? U : never;
export type FunctionInfer<F> = F extends (...args: infer A) => infer R ? [A, R] : never;
export type FirstArgInfer<F> = F extends (first: infer F) => any ? F : never;

export type Optional<T> = T | undefined;
export type IsOptional<T> = ToIntersect<T> extends undefined ? true : false;
export type NonOptional<T> = IsOptional<T> extends true ? NonNullable<T> : T;

export type FlattenObject<T> = T extends object ? {[K in keyof T]: T[K]} : never;
export type OptionalObject<T> = T extends object ? ToIntersect<{
	[K in keyof T]: IsOptional<T[K]> extends true
		? {[X in K]?: T[K]}
		: {[X in K]: T[K]}
}[keyof T]> : never;

export type CleanObject<T extends object> = CastIntersect<{
	[K in keyof T]: T[K] extends never ? never : {[X in K]: T[K]}
}[keyof T], object>;

export type Head<T extends any[]> = T extends [any, ...any[]]
	? T[0]
	: never
;

export type Tail<T extends any[]> =
	((...args: T) => any) extends ((_: any, ...tail: infer TT) => any)
		? TT
		: []
;

export type HasTail<T extends any[]> = T extends ([] | [any]) ? false : true;

export type Last<T extends any[]> = {
	0: Last<Tail<T>>
	1: Head<T>
}[HasTail<T> extends true ? 0 : 1];

export type Length<T extends any[]> = T['length'];

export type Prepend<E, T extends any[]> =
	((head: E, ...args: T) => any) extends ((...args: infer U) => any)
		? U
		: T
;

export type Cast<X, Y> = X extends Y ? X : Y;

export interface Descriptor<ID extends string> {
	readonly id: ID;
	readonly name: ID;
	readonly isOptional: boolean;
	optional(): this | undefined;
}

export type DescriptorWithMeta<ID extends string, M> = Descriptor<ID> & {meta: M};

export type DescriptorWith<ID extends string> = Descriptor<ID> & {
	withMeta: <M>() => DescriptorWithMeta<ID, M>;
}

export type DescriptorWithMetaMap = {
	[key:string]: DescriptorWithMeta<any, any> | undefined;
}

export const __meta__ = Symbol('__meta__');

export type Meta<T> = {
	[__meta__]?: T;
}

export type GetMeta<T extends {[__meta__]?: any}> = {
	[K in keyof T]-?: K extends symbol ? T[K] : never;
}[keyof T]

export type Predicate<T extends object> = ((props: T) => boolean) | Partial<T> | null | undefined
export type PredicateFunc<T extends object> = ((props: T) => boolean) | null
export type DescriptorOverride = {
	xpath: DescriptorWithMeta<string, object>[];
	predicate: PredicateFunc<object>;
}

export type DescriptorOverrideIndex<T extends DescriptorOverride> = Map<
	DescriptorWithMeta<string, object>,
	T[]
>

export type LikeFragment = JSX.Element;
export type LikeComponent<P extends object> = (props: P) => LikeFragment;