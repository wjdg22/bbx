<script lang="ts">
  import { storedProducts, storedHearts, localStore, lsKeyHeart } from '../../stores';
  import Toggle from '../Toggle.svelte';
  import Product from '../Product/Product.svelte';
  import Icon from '../Icon.svelte';
  import { stopClick } from '../../utils';

  export let list = 'default';
  let heartSummary = { price: 0, parts: 0 };
  let title = '';
  let hearts = [];
  let products = [];

  storedProducts.subscribe(store => (products = store));
  storedHearts.subscribe(store => {
    title = store[list].t;
    hearts = store[list].i;
  });

  const clickDeleteList = e => {
    stopClick(e);

    const choice = confirm(`"${title}" wirklich löschen?`);
    if (choice) {
      storedHearts.update(store => {
        delete store[list];
        localStore.set(lsKeyHeart, JSON.stringify(store));
        return store;
      });
    }
  };

  $: heartItems = hearts
    ? hearts
        .map(pID => products.find(product => product.id === pID))
        .sort((a, b) => {
          if (a.title < b.title) {
            return -1;
          }
          if (a.title > b.title) {
            return 1;
          }
          return 0;
        })
        .sort((a, b) => {
          if (a.state.id < b.state.id) {
            return -1;
          }
          if (a.state.id > b.state.id) {
            return 1;
          }
          return 0;
        })
    : [];

  $: {
    // reset
    heartSummary = { price: 0, parts: 0 };
    // calc again
    heartItems.map(product => {
      if (!!product.price && !!product.parts) {
        heartSummary.price += product.price;
        heartSummary.parts += product.parts;
      }
    });
  }
</script>

<Toggle {title} alwaysopen={list === 'default'}>
  <div slot="icon">
    <Icon modifier="heart" svg="true" class="active" title="Will ich haben" />
  </div>
  <div slot="description">
    {#if heartItems.length > 1}
      <span class="summary">
        {heartItems.length} Set´s =
        <strong>Listenpreis:</strong>
        {heartSummary.price.toFixed(2).replace('.', ',')} EUR /
        <strong>Steine:</strong>
        {heartSummary.parts}
      </span>
    {/if}
  </div>
  <div slot="right">
    {#if list !== 'default'}
      <Icon modifier="delete" svg="true" title="Lösche Liste" on:click={clickDeleteList} />
    {/if}
  </div>
  <!--slot-->
  <div class="flex flex--wrap">
    {#each heartItems as product (product.id)}
      <Product {product} type="hearts-{list}" />
    {/each}
  </div>
</Toggle>

<style lang="scss">
  @import '../../scss/variables';

  .summary {
    font-size: ms(-2);
    vertical-align: middle;
  }
</style>
