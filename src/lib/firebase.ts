import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyAAU8G6_I93RuQsfFdOf5wwdU4Wpn3cTXk",
	authDomain: "tiddlywiki-a94cd.firebaseapp.com",
	projectId: "tiddlywiki-a94cd",
	storageBucket: "tiddlywiki-a94cd.appspot.com",
	messagingSenderId: "251419323197",
	appId: "1:251419323197:web:0e0ee30112d98099857354",
};

const app = initializeApp(firebaseConfig);

const auth = getAuth();

const firebase = {
	app,
	auth,
	google_auth_provider: new GoogleAuthProvider(),
	firestore: getFirestore(),
};

firebase.google_auth_provider.addScope(
	"https://www.googleapis.com/auth/cloud-platform",
);
firebase.google_auth_provider.addScope(
	"https://www.googleapis.com/auth/firebase",
);

if (!import.meta.env.PROD) {
	//connectFirestoreEmulator(firebase.firestore, "localhost", 8080);
}

export default firebase;