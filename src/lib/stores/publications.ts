import { writable } from 'svelte/store';
export const activePublicationIndex = writable<number | null>(null);
