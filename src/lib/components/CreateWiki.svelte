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
  let opName = "";
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
    console.log("ABOUT TO POST ", $accessToken, $accessMessage);
    const operationObject = await post(
      "https://cloudresourcemanager.googleapis.com/v3/projects",
      {
        projectId,
        displayName,
      },
      $accessToken
    );
    opName = operationObject.name;
    let projectNumber = 0;
    console.log(`Create: ${projectId} => ${opName}`);
    let operationStatus: any = {};
    let wikiInfo = { error: "Not initialized" };
    const sleep = (delay: number): Promise<boolean> =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, delay);
      });
    function getStatus(prefix: string) {
      return async (): Promise<any> => {
        operationStatus = await get(`${prefix}${opName}`, $accessToken);
        const response = operationStatus?.response;
        const responseType = response ? response["@type"] : "";
        console.log("Status: ", operationStatus);
        if (operationStatus?.done !== true) {
          console.log("Try again in 1000...");
          await sleep(1000);
          return getStatus(prefix)();
        } else if (responseType.indexOf("cloud.resource") !== -1) {
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
          return getStatus("https://appengine.googleapis.com/v1/")();
        } else if (
          responseType.indexOf("googleapis") !== -1
        ) */ projectNumber = response.projectNumber;
          const appInfo = await get(
            "https://firebase.googleapis.com/v1beta1/availableProjects",
            $accessToken
          );
          console.log("Apps: ", appInfo);
          const firebase = await post(
            `https://firebase.googleapis.com/v1beta1/projects/${projectId}:addFirebase`,
            {},
            $accessToken
          );
          opName = firebase.name;
          return getStatus("https://firebase.googleapis.com/v1beta1/")();
        } else if (responseType.indexOf("FirebaseProject") !== -1) {
          const webApp = await post(
            `https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`,
            {
              displayName,
            },
            $accessToken
          );
          opName = webApp.name;
          return getStatus("https://firebase.googleapis.com/v1beta1/")();
        } else if (responseType.indexOf("WebApp") !== -1) {
          const firebaseConfig = await get(
            `https://firebase.googleapis.com/v1beta1/${response.name}/config`,
            $accessToken
          );
          console.log("SETTING wikiInfo");
          wikiInfo = { ...firebaseConfig, displayName, owner: $user.email };
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
            $accessToken
          );
          opName = apiEnabled.name;
          return getStatus("https://serviceusage.googleapis.com/v1/")();
        } else if (responseType.indexOf("EnableServiceResponse") !== -1) {
          const db = await post(
            "https://appengine.googleapis.com/v1/apps",
            {
              databaseType: "CLOUD_FIRESTORE",
              id: projectId,
              locationId: "us-central",
            },
            $accessToken
          );
          opName = db.name;
          return getStatus("https://appengine.googleapis.com/v1/")();
        } else if (responseType.indexOf("Application") !== -1) {
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
          const rulesetCreated = await post(
            createRuleset,
            ruleSet,
            $accessToken
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
            $accessToken
          );
          console.log("CREATE release: ", createRelease);
          //opName = rulesetCreated.name;
          //getStatus("https://firebaserules.googleapis.com/v1/")();
          return true;
        } else {
          console.log(`Unhandled final type ${responseType}`);
        }
        return true;
      };
    }
    await getStatus("https://cloudresourcemanager.googleapis.com/v1/")();
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
<p>{$accessMessage}
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
