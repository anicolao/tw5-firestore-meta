<script lang="ts">
  import { page } from "$app/stores";
  import CreateWiki from "$lib/components/CreateWiki.svelte";
  import WikiList from "$lib/components/WikiList.svelte";
  console.log(`Sveltekit script for ${$page.url}`);
</script>

<h1>Welcome to Firestore backed TiddlyWiki5</h1>

<CreateWiki/>
<WikiList/>