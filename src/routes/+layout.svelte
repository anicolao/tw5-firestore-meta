<script lang="ts">
  import firebase from "$lib/firebase";
  import { setDoc, doc } from "firebase/firestore";
  import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
  } from "firebase/auth";

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
  let me: User = { signedIn: false };
  const auth = firebase.auth;
  const gAuthProvider = firebase.google_auth_provider;
  const uid: string | null = null;

  async function post(url: string, data: any, token: string): Promise<any> {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(data),
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }
  async function patch(url: string, data: any, token: string): Promise<any> {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify(data),
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }
  async function get(url: string, token: string): Promise<any> {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }

  onAuthStateChanged(auth, async (user) => {
    if (user && user.email) {
      const uid: string = user.uid;
      const name: string = user.displayName || "Unknown Name";
      const email: string = user.email;
      const photo: string = user.photoURL || "";
      const last = new Date().getTime();
      console.log(`User: ${user.email}`, user);
      console.log("token?", accessToken);
      me = { signedIn: true, uid, email, name, photo, last };
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

  let accessToken = "Sign in to get an access token.";
  let expiry = 0;
  $: endTime = new Date().getTime() + expiry * 1000;
  $: timeLeft = endTime - new Date().getTime();
  if (typeof window !== "undefined") {
    window.setInterval(() => {
      timeLeft = endTime - new Date().getTime();
    }, 1000);
  }
  $: accessMessage = accessToken.startsWith("Sign")
    ? accessToken
    : `Valid token: ${accessToken.substring(0, 10)}... expires in ${Math.trunc(
        timeLeft / 1000
      )}s`;
  function signin() {
    signInWithPopup(auth, gAuthProvider)
      .then((result) => {
        accessToken = result._tokenResponse.oauthAccessToken;
        expiry = result._tokenResponse.oauthExpireIn;
      })
      .catch((message) => {
        console.error(message);
      });
  }
  function signout() {
    signOut(auth).catch((message) => {
      console.error(message);
    });
  }
  let name = "Untitled";
  let opName = "";
  async function createProject() {
    const projectId = `tw5-${name.toLocaleLowerCase()}-${Math.trunc(
      Math.random() * 10000
    )}`;
    const operationObject = await post(
      "https://cloudresourcemanager.googleapis.com/v1/projects",
      {
        projectId,
      },
      accessToken
    );
    opName = operationObject.name;
    let projectNumber = 0;
    console.log(`Create: ${projectId} => ${opName}`);
    let operationStatus = {};
    function getStatus(prefix: string) {
      return async () => {
        operationStatus = await get(`${prefix}${opName}`, accessToken);
        const response = operationStatus?.response;
        const responseType = response ? response["@type"] : "";
        console.log("Status: ", operationStatus);
        if (operationStatus?.done !== true) {
          console.log("Try again in 1000...");
          window.setTimeout(getStatus(prefix), 1000);
        } else if (responseType.indexOf("cloudresource") !== -1) {
          /*{
          const db = await post(
            "https://appengine.googleapis.com/v1/apps",
            {
              databaseType: "CLOUD_FIRESTORE",
              id: projectId,
              locationId: "us-central",
            },
            accessToken
          );
          opName = db.name;
          getStatus("https://appengine.googleapis.com/v1/")();
        } else if (
          responseType.indexOf("googleapis") !== -1
        ) */ projectNumber = response.projectNumber;
          const appInfo = await get(
            "https://firebase.googleapis.com/v1beta1/availableProjects",
            accessToken
          );
          console.log("Apps: ", appInfo);
          const firebase = await post(
            `https://firebase.googleapis.com/v1beta1/projects/${projectId}:addFirebase`,
            {},
            accessToken
          );
          opName = firebase.name;
          getStatus("https://firebase.googleapis.com/v1beta1/")();
        } else if (responseType.indexOf("FirebaseProject") !== -1) {
          const displayName = `${name} TiddlyWiki`;
          const webApp = await post(
            `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
            {
              displayName,
            },
            accessToken
          );
          opName = webApp.name;
          getStatus("https://firebase.googleapis.com/v1beta1/")();
        } else if (responseType.indexOf("WebApp") !== -1) {
          const firebaseConfig = await get(
            `https://firebase.googleapis.com/v1beta1/${response.name}/config`,
            accessToken
          );
          console.log("Web App Config: ", firebaseConfig);
          const firebaseConfigString = JSON.stringify(firebaseConfig);
          if (typeof window !== undefined) {
            const key = `$:/FirebaseConfig|${window.location.href}tw/${projectId}`;
            window.localStorage.setItem(key, firebaseConfigString);
          }
          const firestoreAPI = `projects/${projectId}/services/firestore.googleapis.com`;
          const apiEnabled = await post(
            `https://serviceusage.googleapis.com/v1/${firestoreAPI}:enable`,
            {},
            accessToken
          );
          opName = apiEnabled.name;
          getStatus("https://serviceusage.googleapis.com/v1/")();
        } else if (responseType.indexOf("EnableServiceResponse") !== -1) {
          const db = await post(
            "https://appengine.googleapis.com/v1/apps",
            {
              databaseType: "CLOUD_FIRESTORE",
              id: projectId,
              locationId: "us-central",
            },
            accessToken
          );
          opName = db.name;
          getStatus("https://appengine.googleapis.com/v1/")();
        } else if (responseType.indexOf("Application") !== -1) {
          const createRuleset = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;
          const sleep = (delay: number): Promise<boolean> =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve(true);
              }, delay);
            });

          let rulesets = { error: "startup" };
          while (rulesets?.error) {
            if (rulesets.error !== "startup") {
              console.log(`API not ready error: `, rulesets.error);
              await sleep(5000);
            }
            rulesets = await get(createRuleset, accessToken);
          }
          console.log("rules: ", rulesets);
          const ruleSet = {
            source: {
              files: [
                {
                  content:
                    "rules_version = '2';\n\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if true;\n    }\n  }\n}",
                  name: "firestore.rules",
                },
              ],
            },
            metadata: {
              services: ["cloud.firestore"],
            },
          };
          const rulesetCreated = await post(
            createRuleset,
            ruleSet,
            accessToken
          );
          const rulesetName = rulesetCreated.name;
          const base = `https://firebaserules.googleapis.com/v1/`;
          const release = `projects/${projectId}/releases`;
          const createRelease = await post(
            `${base}${release}`,
            {
              rulesetName,
              name: release + "/cloud.firestore",
            },
            accessToken
          );
          console.log("CREATE release: ", createRelease);
          //opName = rulesetCreated.name;
          //getStatus("https://firebaserules.googleapis.com/v1/")();
        } else {
          console.log(`Unhandled final type ${responseType}`);
        }
      };
    }
    getStatus("https://cloudresourcemanager.googleapis.com/v1/")();
  }

  let manualProjectId = "enter_an_id";
  async function getRulesets() {
    const createRuleset = `https://firebaserules.googleapis.com/v1/projects/${manualProjectId}/rulesets`;
    const rulesets = await get(createRuleset, accessToken);
    console.log("rules: ", rulesets);
  }
  async function writeRuleset() {
    const base = `https://firebaserules.googleapis.com/v1/`;
    const createRuleset = `${base}projects/${manualProjectId}/rulesets`;
    const rulesets = await get(createRuleset, accessToken);
    console.log("rules: ", rulesets);
    const ruleSet = {
      source: {
        files: [
          {
            content:
              "rules_version = '2';\n\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}",
            name: "firestore.rules",
          },
        ],
      },
      metadata: {
        services: ["cloud.firestore"],
      },
    };
    const rulesetCreated = await post(createRuleset, ruleSet, accessToken);
    opName = rulesetCreated.name;
    console.log("operation: ", rulesetCreated);
  }

  $: if (timeLeft < 1000) {
    signout();
  }

  if (accessToken.startsWith("Sign")) {
    signout();
  }
</script>

{#if me.signedIn !== true}
  {#if me.signedIn === null}
    <p>Loading...</p>
  {:else}
    <button on:click={signin}>Sign In</button>
  {/if}
{:else}
  <slot />
  <pre>{accessMessage}</pre>
  <input type="text" bind:value={name} />
  <button on:click={createProject}>Create TiddlyWiki</button>
  <input type="text" bind:value={manualProjectId} />
  <button on:click={getRulesets}>Get Rulesets</button>
  <button on:click={writeRuleset}>Write Ruleset</button>
  <br /><button on:click={signout}>Sign Out</button>
{/if}

<style>
  input {
    margin: 0.4em;
  }
  button {
    margin: 0.4em;
  }
</style>
