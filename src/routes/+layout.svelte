<script lang="ts">
  import Instructions from "$lib/components/Instructions.svelte";
  import firebase from "$lib/firebase";
  import { accessMessage, accessToken, user } from "$lib/globals";
  import {
    onAuthStateChanged,
    signInWithPopup,
  } from "firebase/auth";
  import { doc, setDoc } from "firebase/firestore";

  let me: User = { signedIn: false };
  const auth = firebase.auth;
  const gAuthProvider = firebase.google_auth_provider;

  onAuthStateChanged(auth, async (user) => {
    if (user && user.email) {
      const uid: string = user.uid;
      const name: string = user.displayName || "Unknown Name";
      const email: string = user.email;
      const photo: string = user.photoURL || "";
      const last = new Date().getTime();
      console.log(`User: ${user.email}`, user);
      console.log("token?", $accessToken);
      me = { signedIn: true, uid, email, name, photo, last };
      $user = me;
      console.log("Attempt to set user doc.")
      setDoc(doc(firebase.firestore, "users", user.email), { ...me }).catch(
        (message) => {
          // TODO: Surface this error state in the UI.
          console.error(message);
        }
      );
    } else {
      me = { signedIn: false };
    }
  });

  $accessToken = "Sign in to get an access token.";
  let expiry = 0;
  $: endTime = new Date().getTime() + expiry * 1000;
  $: timeLeft = endTime - new Date().getTime();
  if (typeof window !== "undefined") {
    window.setInterval(() => {
      timeLeft = endTime - new Date().getTime();
    }, 1000);
  }
  $: $accessMessage = $accessToken.startsWith("Sign")
    ? $accessToken
    : `Valid token: ${$accessToken.substring(0, 10)}... expires in ${Math.trunc(
        timeLeft / 1000
      )}s`;
  function signin() {
    signInWithPopup(auth, gAuthProvider)
      .then((result) => {
        $accessToken = (result as any)._tokenResponse.oauthAccessToken;
        expiry = (result as any)._tokenResponse.oauthExpireIn;
      })
      .catch((message) => {
        console.error(message);
      });
  }

</script>

{#if me.signedIn !== true}
  {#if me.signedIn === null}
    <p>Loading...</p>
  {:else}
    <Instructions signin={signin} />
  {/if}
{:else}
  <slot />
{/if}
