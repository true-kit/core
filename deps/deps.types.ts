export type LikeComponent<P extends object> = (props: P) => JSX.Element;

export type DepsSpec = {
	[key:string]: object | undefined;
}

export type Deps<T extends DepsSpec> = {
	[K in keyof T]?: LikeComponent<any>;
}

export type DepsRegistry = {
	map: Map<LikeComponent<any>, Deps<any>> | null;
	overrides: null; // @todo
}