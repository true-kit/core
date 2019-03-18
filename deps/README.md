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
import { InputProps } from '@truekit/Button/types';
import { ButtonProps } from '@truekit/Input/types';

type FormProps = {
	action: string;
	method: 'GET' | 'POST';

	deps?: Deps<{
		Input: InputProps;
		Bitton: ButtonProps;
	}>;
};
```