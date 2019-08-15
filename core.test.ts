import {
	createDescriptor,
} from './core';

it('createDescriptor', () => {
	const $desc = createDescriptor('uniq');
	expect($desc.id).toBe('uniq');
	expect($desc.id).toBe($desc.name);
});
