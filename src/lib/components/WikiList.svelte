<script lang="ts">
  import { page } from "$app/stores";
  import firebase from "$lib/firebase";
  import { user } from "$lib/globals";
  import { setWikiConfiguration } from "$lib/localstorage";
  import { collection, onSnapshot } from "firebase/firestore";

    let wikis: any[] = [];
    const wikiCollection = collection(firebase.firestore, `users/${$user.email}/wikis`);
    const unsub = onSnapshot(wikiCollection, (snapshot) => {
        const changed = snapshot.docChanges();
        changed.forEach(wiki => {
            const w = wiki.doc.data();
            w.url = `/tw/${w.projectId.split("-")[1]}`;
            setWikiConfiguration($page.url, w)
            wikis.push(w);
            wikis = wikis;
        });
    });
</script>

<ul>
{#each wikis as wiki (wiki.projectId)}
<li><a href="{wiki.url}">{wiki.displayName}</a></li>
{/each}
</ul>