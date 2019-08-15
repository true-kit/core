import { createElement, ReactElement } from 'react';
import { ComponentDescriptor, ComponentRender } from './component.types';
import { createDescriptor, getDescriptorOverride } from '../core';
import {
	createDepsDescriptor,
	createDepsBy,
	createStrictDepsBy,
} from '../deps';
import { DescriptorWithMetaMap } from '../core.types';
import { withEnvScope, getActiveEnvScope, getEnvContext } from '../env/env';
import { useTheme, createThemeFor } from '../theme';
import { EnvContextProps } from '../env/env.types';

export function createComponentDescriptor<
	N extends string,
	P extends object,
	DM extends DescriptorWithMetaMap,
>(
	name: N,
	props: P,
	deps?: DM,
): ComponentDescriptor<N, P, DM> {
	const $descriptor = createDescriptor(name).withMeta<P>() as ComponentDescriptor<N, P, DM>;
	const $deps = createDepsDescriptor($descriptor, Object(deps));

	$descriptor.deps = $deps;
	$descriptor.props = props;

	$descriptor.createComponent = (render) => createComponent($descriptor, render);
	$descriptor.createTheme = (rules) => createThemeFor($descriptor, rules);
	$descriptor.createDeps = (deps) => createDepsBy($deps, deps as any);
	$descriptor.createStrictDeps = (deps) => createStrictDepsBy($deps, deps as any);

	return $descriptor;
}

export function createComponent<
	D extends ComponentDescriptor<any, any, any>,
>(
	$descriptor: D,
	render: ComponentRender<D>,
): (props: D['meta']) => ReactElement {
	const $deps = $descriptor.deps;

	function Component(props: D['meta']) {
		const entry: EnvContextProps = {
			deps: null,
			theme: null,
			depsInjection: null,
			props,
		};

		return withEnvScope($descriptor, entry, () => {
			const ctx = getEnvContext();
			const overrides = ctx !== null && ctx.deps !== null ? ctx.deps.overrides : null;

			if (overrides !== null && overrides.has($descriptor)) {
				const override = getDescriptorOverride(overrides.get($descriptor)!, ctx!);

				if (override !== null && override.value !== Component) {
					return override.value(props);
				}
			}

			const theme = useTheme($descriptor, props, ctx);
			const deps = $deps.use(props, ctx);

			return render(
				createElement,
				props,
				{theme, Slot} as any,
				deps as any,
			);
		});
	}

	Component.$descriptor = $descriptor;
	Component.displayName = $descriptor.name;

	return Component;
}

type SlotProps = {
	name: string;
	value: any;
	children: React.ReactNode;
}

function Slot({name, children, value}: SlotProps) {
	if (name == null || name === 'default') {
		name = 'children';
	}

	const envScope = getActiveEnvScope();
	const scopeProps = (envScope !== null && envScope.ctx !== null) ? envScope.ctx.props : null;
	const content = scopeProps != null ? scopeProps[name] : undefined;

	if (content === null) {
		return null;
	}

	// Перегрузка слота
	if (content !== undefined) {
		if (typeof content === 'function') {
			const result = content(children, value);

			if (result === null) {
				return null;
			} else if (result !== undefined) {
				return result;
			}
		} else {
			return content;
		}
	}

	if (children == null) {
		return null;
	}

	if (typeof children === 'function') {
		return children(value);
	}

	return children;
}
