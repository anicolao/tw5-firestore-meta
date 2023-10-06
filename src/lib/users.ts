interface SignedOutUser {
	signedIn: false;
}
interface SignedInUser {
	signedIn: true;
	uid: string;
	name: string;
	email: string;
	photo: string;
	last: number;
}
type User = SignedOutUser | SignedInUser;
