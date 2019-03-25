import { DepsRegistry, LikeComponent } from '../deps/deps.types';
import { ThemeRegistry } from '../theme/theme.types';

export type EnvContextProps = {
	deps: DepsRegistry | null;
	depsInjection: Map<string, LikeComponent<any>> | null;
	theme: ThemeRegistry | null;
}

export type EnvContextEntry = EnvContextProps & {
	parent: EnvContextEntry | null;
}

export type EnvScope = null | {
	parent: EnvScope;
	Owner: Function | null;
	ctx: EnvContextProps | null;
}

export type EnvContextProviderProps<K extends keyof EnvContextProps> = {
	value: EnvContextProps[K];
	children?: React.ReactNode;
}