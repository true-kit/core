import {
	Fragment,
	createElement,
	createContext,
	useContext,
} from 'react';

import {
	EnvContextProps,
	EnvScope,
	EnvContextEntry,
	EnvContextProviderProps,
} from './env.types';

let activeEnvScope: EnvScope = null;
let envScopeEndAnchor = () => {
	// @todo: проверить, как вё это работает с React Fiber
	if (activeEnvScope !== null) {
		// const Owner = activeEnvScope.Owner
		// console.log('End:', Owner && Owner.name);
		activeEnvScope = activeEnvScope.parent;
	}

	return null;
};

export const EnvContext = createContext<EnvContextEntry>({
	parent: null,
	deps: null,
	theme: null,
});

export function createEnvContextEntry(ctx: Partial<EnvContextProps>): EnvContextEntry {
	return {
		parent: useContext(EnvContext),
		deps: ctx.deps || null,
		theme: ctx.theme || null,
	};
}

export function withEnvScope<R>(
	Owner: Function | null,
	ctx: EnvContextProps | null,
	executer: () => R,
): R {
	const overrideEnabled = (ctx || activeEnvScope) !== null;

	if (overrideEnabled) {
		const envScope: EnvScope = {
			parent: activeEnvScope,
			Owner,
			ctx,
		};

		activeEnvScope = envScope;
	}

	const fragment = executer();

	if (overrideEnabled) {
		// console.log('Start:', Owner && Owner.name);
		// @todo: проверить наличиен чайлов, и если их нет, сразу возвращать `activeEnvScope`
		return createElement(Fragment, null, fragment, createElement(envScopeEndAnchor)) as any as R;
	}

	return fragment;
}

export function getActiveEnvScope() {
	return activeEnvScope;
}

export function getEnvContext(): EnvContextEntry | null {
	const ctx = useContext(EnvContext);
	return ctx || null
}

export function createEnvContextProvider<K extends keyof EnvContextProps>(key: K) {
	function Provider(props: EnvContextProviderProps<K>) {
		const next = createEnvContextEntry({
			[key]: props.value,
		});

		return withEnvScope(null, next, () => {
			return createElement(EnvContext.Provider, {value: next}, props.children);
		});
	}

	Provider['displayName'] = `${key.charAt(0).toUpperCase() + key.substr(1)}ContextProvider`;

	return Provider;
}
