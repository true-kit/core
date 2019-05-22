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
import { $input } from '@truekit/Input/types';
import { $button } from '@truekit/Button/types';

type FormProps = {
	action: string;
	method: 'GET' | 'POST';

	deps?: Deps<{
		Input: typeof $input;
		Button: typeof $button;
	}>;
};
```