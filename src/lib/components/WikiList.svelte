<script lang="ts">
  import firebase from "$lib/firebase";
  import { user } from "$lib/globals";
  import { collection, onSnapshot } from "firebase/firestore";

    let wikis: any[] = [];
    const wikiCollection = collection(firebase.firestore, `users/${$user.email}/wikis`);
    const unsub = onSnapshot(wikiCollection, (snapshot) => {
        const changed = snapshot.docChanges();
        changed.forEach(wiki => {
            const w = wiki.doc.data();
            w.url = `/tw/${w.projectId.split("-")[1]}`;
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