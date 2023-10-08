<script lang="ts">
  import { page } from "$app/stores";
  import CreateWiki from "$lib/components/CreateWiki.svelte";
  import WikiList from "$lib/components/WikiList.svelte";
  console.log(`Sveltekit script for ${$page.url}`);
</script>

<div>
<h1>Firestore backed TiddlyWiki5</h1>
<p>
  This site will ask for your authorization to access Google Cloud and Firestore
  on your behalf in order to create a Firestore backend for your personal
  TiddlyWiki5 instance. For this to work, you need to have already accepted the
  Firestore terms of service which you can do by visiting the <a
    href="https://console.firebase.google.com/">Firebase Console</a
  > and creating at least one Firebase project before creating your wiki.
</p>
<p>
  You can also use this website to access other people's firestore wikis if they
  shared them with you. For that, no special Google Cloud access is needed.
</p>
<p><CreateWiki /></p>
<WikiList />
</div>

<style>
  div>* {
    margin-block-start: 0;
    margin-block-end: 0;
    padding-top: 0.5vw;
    padding-left: 1vw;
    padding-right: 1vw;
  }
  div {
    background-color: ivory;
    color: black;
    margin: 0;
    padding: 0;
    font-family: sans-serif;
    font-size: 120%;
  }
</style>
