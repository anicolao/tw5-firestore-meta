console.log("firebase start");
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyAAU8G6_I93RuQsfFdOf5wwdU4Wpn3cTXk",
	authDomain: "tiddlywiki-a94cd.firebaseapp.com",
	projectId: "tiddlywiki-a94cd",
	storageBucket: "tiddlywiki-a94cd.appspot.com",
	messagingSenderId: "251419323197",
	appId: "1:251419323197:web:0e0ee30112d98099857354",
};

const app = initializeApp(firebaseConfig);

console.log("passed app to getAuth");
const auth = getAuth(app);

const firebase = {
	app,
	auth,
	google_auth_provider: new GoogleAuthProvider(),
	firestore: initializeFirestore(app, {
		experimentalForceLongPolling: true,
	}),
};

firebase.google_auth_provider.addScope(
	"https://www.googleapis.com/auth/cloud-platform",
);
firebase.google_auth_provider.addScope(
	"https://www.googleapis.com/auth/firebase",
);

if (!import.meta.env.PROD) {
	console.log("no emulator");
	//connectFirestoreEmulator(firebase.firestore, "localhost", 8080);
}

export default firebase;

console.log("firebase end");
