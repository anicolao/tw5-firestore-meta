import { writable } from "svelte/store";

export const accessMessage = writable("");
export const accessToken = writable("");
export const user = writable<SignedInUser>();
export const expiry = writable(0);
