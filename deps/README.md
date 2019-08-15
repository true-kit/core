@truekit/core: deps
-------------------
Describing and resolving dependencies of component (aka DI).

```sh
npm i --save-dev @truekit/core
```

---

### Usage

```tsx
import { Deps } from '@truekit/core/deps';
import { $Input } from '@truekit/Input/types';
import { $Button } from '@truekit/Button/types';

export type FormProps = {
	action: string;
	method: 'GET' | 'POST';

	deps?: Deps<{
		Input: typeof $Input;
		Button: typeof $Button;
	}>;
}
```


---


#### API

- `createDeps` — произволные зависимости
- `createDepsBy` — произволные зависимости описанные по компоненты
- `createStrictDepsBy` — строгие зависимости
- `createDepsOverride` —