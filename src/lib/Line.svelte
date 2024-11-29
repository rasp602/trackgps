<script lang="ts">
	import { onMount, onDestroy, getContext, setContext } from 'svelte';
	import L from 'leaflet';

	export let latLngC1: L.LatLngExpression;
	export let latLngC2: L.LatLngExpression;
	export let colorbg: string;

	let line: L.Polyline | undefined;
	let lineElement: HTMLElement;

	const { getMap }: { getMap: () => L.Map | undefined } = getContext('map');
	const map = getMap();

	setContext('layer', {
		// L.Marker inherits from L.Layer
		getLayer: () => line
	});

	onMount(() => {
		if (map) {	
            let lineMap = [
                latLngC1, latLngC2
            ];
			line = L.polyline(lineMap, {color: colorbg}).addTo(map);
		}
	});

	onDestroy(() => {
		line?.remove();
		line = undefined;
	});
	
	$: if (line && latLngC1 && latLngC2) {
        // Actualiza la posición del marcador cuando cambia latLng
        let lineMap = [
                latLngC1, latLngC2
            ];
        line.setLatLngs(lineMap);
    }
</script>

<div bind:this={lineElement}>
	{#if line}
		<slot />
	{/if}
</div>
