import { signInWithPopup } from "firebase/auth";
import firebase from "./firebase";
import { accessToken, expiry } from "$lib/globals";

const auth = firebase.auth;
const gAuthProvider = firebase.google_auth_provider;

export function signin() {
	signInWithPopup(auth, gAuthProvider)
		.then((result) => {
			accessToken.set((result as any)._tokenResponse.oauthAccessToken);
			expiry.set((result as any)._tokenResponse.oauthExpireIn);
		})
		.catch((message) => {
			console.error(message);
		});
}
