<script lang="ts">
  import { page } from "$app/stores";
  import firebase from "$lib/firebase";
  import { accessToken, user } from "$lib/globals";
  import { get, httpDelete } from "$lib/http";
  import { setWikiConfiguration } from "$lib/localstorage";
  import {
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
  } from "firebase/firestore";

  let wikis: any[] = [];
  const wikiCollection = collection(
    firebase.firestore,
    `users/${$user.email}/wikis`
  );
  const unsub = onSnapshot(wikiCollection, (snapshot) => {
    const changed = snapshot.docChanges();
    changed.forEach((wiki) => {
      const w = wiki.doc.data();
      w.url = `/tw/${w.projectId.split("-")[1]}`;
      setWikiConfiguration($page.url, w);
      if (w.markedForDeletion) {
        console.log(`Should delete ${w.projectId}`);
        wikis = wikis.filter((f) => w.projectId !== f.projectId);
        async function cleanupWiki() {
          const projectURL = `https://cloudresourcemanager.googleapis.com/v3/projects/${w.projectId}`;
          const cloudProject = await get(projectURL, $accessToken);
          console.log("PROJECT: ", cloudProject);
          if (cloudProject?.state === "DELETE_REQUESTED") {
            console.log("Cloud project already deleted. Clean up firebase");
            deleteDoc(doc(wikiCollection, w.projectId));
          } else if (cloudProject?.state) {
            httpDelete(
              `https://cloudresourcemanager.googleapis.com/v3/projects/${w.projectId}`,
              $accessToken
            );
          } else {
            console.log(
              "Probably not authenticated. Wait for next time to delete."
            );
          }
        }
        cleanupWiki();
      } else if (wiki.type !== "removed") {
        wikis.push(w);
      } else if (wiki.type === "removed") {
        wikis = wikis.filter((f) => w.projectId !== f.projectId);
      }
      wikis = wikis;
    });
  });
  function owner(w: any) {
    return w.owner === $user.email;
  }
  function deleteWiki(w: any) {
    return () => {
      console.log("DELETE ", w);
      w.markedForDeletion = true;
      updateDoc(doc(wikiCollection, w.projectId), w);
    };
  }
  function removeWiki(w: any) {
    return () => {
      deleteDoc(doc(wikiCollection, w.projectId));
    };
  }

  let shareEmail = "";
  function share(w: any) {
    return () => {
      console.log(`Should share with ${shareEmail}`);
      const shareCollection = collection(
        firebase.firestore,
        `users/${shareEmail}/wikis`
      );
      setDoc(doc(shareCollection, w.projectId), w);
    };
  }
  function invalidEmail(email: string) {
    return !email.match(/^[^@]+@([^\.]+\.)+[^\.]+/);
  }
</script>

<ul>
  {#each wikis as wiki (wiki.projectId)}
    <li>
      <a href={wiki.url}>{wiki.displayName}</a><span/>
      <input type="text" bind:value={shareEmail} />
      <button disabled={invalidEmail(shareEmail)} on:click={share(wiki)}
        >Share with "{shareEmail}"</button
      >
      {#if owner(wiki)}
        <button on:click={deleteWiki(wiki)}>🗑</button>
      {:else}
        <button on:click={removeWiki(wiki)}>Remove</button>
      {/if}
    </li>
  {/each}
</ul>

<style>
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    padding: 0.5em;
    border-bottom: 1px dashed lightgray;
    display: flex;
    flex-direction: row;
  }
  li>* {
    margin: 0.5em;
  }
  li>span {
    flex-grow: 1;
  }
</style>