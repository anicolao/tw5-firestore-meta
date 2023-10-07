<script lang="ts">
  import { page } from "$app/stores";
  import { signin } from "$lib/auth";
  import firebase from "$lib/firebase";
  import { accessMessage, accessToken, user } from "$lib/globals";
  import { get, post } from "$lib/http";
  import { setWikiConfiguration } from "$lib/localstorage";
  import { signOut } from "firebase/auth";
  import { doc, setDoc } from "firebase/firestore";

  let displayName = "Untitled";
  const sleep = (delay: number): Promise<boolean> =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, delay);
    });
  async function pollOperation(
    prefix: string,
    opName: string,
    accessToken: string
  ) {
    const operationStatus = await get(`${prefix}${opName}`, $accessToken);
    console.log("Operation Status: ", operationStatus);
    if (operationStatus?.done !== true) {
      console.log("Try again in 1000...");
      await sleep(1000);
      return pollOperation(prefix, opName, accessToken);
    }
    return operationStatus;
  }
  async function callAPI(api: string, payload: any) {
    let extract = /^https:..[^/]+.[^/]+./;
    let prefixMatch = extract.exec(api);
    let prefix = prefixMatch !== null ? prefixMatch[0] : api;
    const operationObject = await post(api, payload, $accessToken);
    return pollOperation(prefix, operationObject.name, $accessToken);
  }
  async function createProject() {
    function transformDisplayName(name: string) {
      return name
        .toLocaleLowerCase()
        .replaceAll(/[^a-z0-9]/g, "")
        .substring(0, 30);
    }
    const projectId = `tw5-${transformDisplayName(displayName)}-${Math.trunc(
      Math.random() * 10000
    )}`;
    const createProjectAPI =
      "https://cloudresourcemanager.googleapis.com/v3/projects";
    let result = await callAPI(createProjectAPI, {
      projectId,
      displayName,
    });
    let response = result.response;
    const addFirebaseProject = `https://firebase.googleapis.com/v1beta1/projects/${projectId}:addFirebase`;
    result = await callAPI(addFirebaseProject, {});
    const addWebApp = `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`;
    result = await callAPI(addWebApp, { displayName });
    response = result.response;
    const firebaseConfig = await get(
      `https://firebase.googleapis.com/v1beta1/${response.name}/config`,
      $accessToken
    );
    let wikiInfo = { ...firebaseConfig, displayName, owner: $user.email };
    console.log("Web App Config: ", firebaseConfig);
    const firebaseConfigString = JSON.stringify(firebaseConfig);
    if (typeof window !== undefined) {
      const key = `$:/FirebaseConfig|${window.location.href}tw/${projectId}`;
      window.localStorage.setItem(key, firebaseConfigString);
    }
    const firestoreAPI = `projects/${projectId}/services/firestore.googleapis.com`;
    const enableFirestore = `https://serviceusage.googleapis.com/v1/${firestoreAPI}:enable`;
    result = await callAPI(enableFirestore, {});
    const createFirestore = "https://appengine.googleapis.com/v1/apps";
    result = await callAPI(createFirestore, 
      {
        databaseType: "CLOUD_FIRESTORE",
        id: projectId,
        locationId: "us-central",
      }
    );
    const createRuleset = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;
    let rulesets = { error: "startup" };
    while (rulesets?.error) {
      if (rulesets.error !== "startup") {
        console.log(`API not ready error: `, rulesets.error);
        await sleep(5000);
      }
      rulesets = await get(createRuleset, $accessToken);
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
    const rulesetCreated = await post(createRuleset, ruleSet, $accessToken);
    const rulesetName = rulesetCreated.name;
    const base = `https://firebaserules.googleapis.com/v1/`;
    const release = `projects/${projectId}/releases`;
    const createRelease = await post(
      `${base}${release}`,
      {
        rulesetName,
        name: release + "/cloud.firestore",
      },
      $accessToken
    );
    console.log("CREATE release: ", createRelease);

    console.log("GETTING wikiInfo", wikiInfo);
    if (wikiInfo?.error === undefined) {
      setWikiConfiguration($page.url, wikiInfo);
    }
    setDoc(
      doc(firebase.firestore, "users", $user.email, "wikis", projectId),
      wikiInfo
    ).catch((err) => {
      console.error(err);
    });
  }

  const auth = firebase.auth;
  function signout() {
    signOut(auth).catch((message) => {
      console.error(message);
    });
  }
</script>

{#if $accessMessage.startsWith("Sign")}
  <p>
    {$accessMessage}
    <button on:click={signin}>Sign In</button>
  </p>
{:else}
  <pre>{$accessMessage}</pre>
  <input type="text" bind:value={displayName} />
  <button on:click={createProject}>Create TiddlyWiki</button>
{/if}
<br /><button on:click={signout}>Sign Out</button>

<style>
  input {
    margin: 0.4em;
  }
  button {
    margin: 0.4em;
  }
</style>
