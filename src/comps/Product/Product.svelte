<script lang="ts">
  import Tooltip from './ProductTooltip.svelte';
  import Icon from '../Icon.svelte';
  import ClickOutside from 'svelte-click-outside';
  import {
    ID_BURG_BLAUSTEIN,
    ID_MANHATTAN,
    ID_MOVIE,
    ID_NETHERLAND,
    ID_STAR_TREK,
    ID_STATE_ANNOUNCEMENT,
    ID_STATE_AVAILABLE,
    ID_STATE_COMING_SOON,
    STR_MANHATTAN,
    STR_NETHERLAND,
    STR_BURG_BLAUSTEIN,
    STR_STAR_TREK,
    UNLOADED,
  } from '../../_interfaces';
  import { storedGlobalData, storedActiveSelection, storedStates, storedHearts, loadInstData } from '../../stores';
  import { getLatestStateOfToday } from '../../utils';
  import { storedActiveProduct } from '../../stores/states';

  export let product: any;
  export let withoutTooltip: boolean = false;
  export let type: string = ''; // todayChanges
  export let todayChangesDate: string = ''; // 08.10.2021

  let data: any;
  let states: any;
  let hearts: any;
  let heartLists: any;
  let activeProduct: any;
  let activeTagsIds: any;
  let dataLoaded: string;
  let showTooltip = false;
  let isHeart: boolean = false;
  let isNew: boolean = false;
  let isHot: boolean = false;
  let isActive: boolean = false;

  storedActiveSelection.subscribe(store => {
    activeTagsIds = store.tags;
    dataLoaded = store.loadedData.inst;
  });
  storedActiveProduct.subscribe(store => {
    activeProduct = store.product;
    if (activeProduct && ((activeProduct.id !== product.id && activeProduct.type === type) || activeProduct.id === 0)) {
      showTooltip = false;
    }
  });
  storedGlobalData.subscribe(store => (data = store));
  storedStates.subscribe(store => (states = store));
  storedHearts.subscribe(store => {
    hearts = store;
    heartLists = Object.keys(hearts);
  });

  $: {
    isActive = (activeProduct && activeProduct.id === product.id && type === activeProduct.type) || false;

    if (dataLoaded === UNLOADED && isActive) {
      loadInstData();
    }

    // TODO: ab in den store
    const historyStates = Object.values(product.history);
    const lastHistory = historyStates[historyStates.length - 1];
    const beforeLastHistory = historyStates[historyStates.length - 2];
    const beforeBeforeLastHistory = historyStates[historyStates.length - 3];
    isNew =
      (lastHistory === ID_STATE_AVAILABLE && beforeLastHistory === ID_STATE_ANNOUNCEMENT) ||
      (lastHistory === ID_STATE_AVAILABLE &&
        beforeLastHistory === ID_STATE_COMING_SOON &&
        beforeBeforeLastHistory === ID_STATE_ANNOUNCEMENT);
    isHot = historyStates.filter(state => state === 0).length >= 3;
    isHeart = heartLists.find(list => hearts[list].i.includes(product.id));
  }

  const onClick = () => {
    // toggle tooltip
    showTooltip = !showTooltip;

    // update store to close other tooltips
    storedActiveProduct.update(store => {
      store.product = {
        id: showTooltip ? product.id : 0,
        type,
      };
      store.reason = 'open-tooltip';
      return store;
    });
  };

  const onClickOutside = () => {
    if (isActive) {
      showTooltip = false;
      storedActiveProduct.update(store => {
        store.product = {
          id: 0,
          type,
        };
        store.reason = 'click-outside';
        return store;
      });
    }
  };

  const getTitle = product => {
    const isBurgBlaustein = activeTagsIds && activeTagsIds.includes(ID_BURG_BLAUSTEIN) && activeTagsIds.length === 1;
    const isNetherland = activeTagsIds && activeTagsIds.includes(ID_NETHERLAND) && activeTagsIds.length === 1;
    const isManhattan = activeTagsIds && activeTagsIds.includes(ID_MANHATTAN) && activeTagsIds.length === 1;
    const isMovieFilterOnly = activeTagsIds && activeTagsIds.includes(ID_MOVIE) && activeTagsIds.length === 1;
    const isStarTrekFilterOnly = activeTagsIds && activeTagsIds.includes(ID_STAR_TREK) && activeTagsIds.length === 1;
    const isStarTrek = !!product.title && product.title.includes(STR_STAR_TREK);
    let title = product.title;

    if (isBurgBlaustein) {
      title = title.replace(' für ' + STR_BURG_BLAUSTEIN, '');
    }

    if (isNetherland) {
      title = title.replace(STR_NETHERLAND + ' ', '');
    }

    if (isManhattan) {
      title = title.replace(STR_MANHATTAN + ' ', '');
    }

    if (isStarTrek && (isMovieFilterOnly || isStarTrekFilterOnly)) {
      title = title.replace(STR_STAR_TREK + ' ', '');
      product.movieData = STR_STAR_TREK;
    }

    return title;
  };

  const handleStateName = product => {
    let stateName = product.state.id > 0 ? product.state.de : null;
    if (!!todayChangesDate) {
      const stateId = getLatestStateOfToday(product, todayChangesDate);
      const state = states.find(state => state.id === stateId);
      stateName = stateId > 0 ? state.de : null;
    }
    return stateName;
  };

  const handleStateColor = product => {
    let stateColor = product.state.color;
    if (!!todayChangesDate) {
      const stateId = getLatestStateOfToday(product, todayChangesDate);
      const state = states.find(state => state.id === stateId);
      stateColor = state.color;
    }
    return stateColor;
  };
</script>

<ClickOutside on:clickoutside={onClickOutside}>
  <div class="product {handleStateColor(product)}" data-state={handleStateName(product)}>
    <span class="product__label" on:click={onClick}>
      {#if isHeart && !type.startsWith('hearts')}
        <Icon modifier="heart" svg="true" class="active" title="Merkliste" />
      {/if}
      {#if isNew && !isHeart}<Icon modifier="new" title="Neues Produkt" />{/if}
      {#if isHot && !isHeart}<Icon modifier="flame" title="Beliebtes Produkt" />{/if}
      {getTitle(product)}
      {#if type === 'products' && product.movieData && activeTagsIds.includes(ID_MOVIE)}
        <span class="product__movie">{product.movieData}</span>
      {/if}
    </span>
    {#if !withoutTooltip}
      <Tooltip {product} showTooltip={isActive} />
    {/if}
  </div>
</ClickOutside>

<style lang="scss">
  @import '../../scss/variables';

  .product {
    position: relative;
    margin: $space-xs;
    text-decoration: none;
    color: $color-white;
    background: $color-primary;
    padding: 0 $space-lg;
    border-radius: $space-xl;
    font-size: ms(2);
    user-select: none;
    cursor: pointer;

    @media (min-width: 750px) {
      font-size: ms(0);
    }

    &__label {
      display: block;
    }

    &__movie {
      display: block;
      font-size: ms(-1);
      position: relative;
      top: -3px;

      @media (min-width: 750px) {
        font-size: ms(-3);
      }
    }

    &.green {
      background: $color-comingsoon;
    }

    &.red {
      background: $color-unavailable;
    }

    &.orange {
      background: $color-annoucement;
    }

    &:hover {
      background: $color-primary-darker;
    }
  }
</style>
