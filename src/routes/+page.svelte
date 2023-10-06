<script lang="ts">
  import { page } from "$app/stores";
  import CreateWiki from "$lib/components/CreateWiki.svelte";
  import WikiList from "$lib/components/WikiList.svelte";
  import { setWikiConfiguration } from "$lib/localstorage"
  console.log(`Sveltekit script for ${$page.url}`);
  try {
    const pocConfig = {
      apiKey: "AIzaSyAAU8G6_I93RuQsfFdOf5wwdU4Wpn3cTXk",
      authDomain: "tiddlywiki-a94cd.firebaseapp.com",
      projectId: "tiddlywiki-a94cd",
      storageBucket: "tiddlywiki-a94cd.appspot.com",
      messagingSenderId: "251419323197",
      appId: "1:251419323197:web:0e0ee30112d98099857354",
    };
    setWikiConfiguration($page.url, pocConfig);
  } catch (err) {
    console.error(err);
  }
</script>

<h1>Welcome to Firestore backed TiddlyWiki5</h1>

<p>Go to the <a href="/tw/poc">Proof of Concept</a>.</p>

<CreateWiki/>
<WikiList/>
