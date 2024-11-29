<script lang="ts">
	import { onMount, onDestroy, getContext, setContext } from 'svelte';
	import L from 'leaflet';
	
	import 'leaflet-routing-machine';
	import 'leaflet-control-geocoder';

	import pin from '$img/pin.png';

    export let points = [];


	const customIcon = new L.Icon({
		iconUrl: pin,
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		shadowSize: [41, 41]
	});

    let route = L.Routing | undefined;
    let routeElement: HTMLElement;

    const { getMap }: { getMap: () => L.Map | undefined } = getContext('map');
	const map = getMap();

    setContext('layer', {
		// L.Marker inherits from L.Layer
		getLayer: () => route
	});

	onMount(() => {    
        console.log(points)   

        let pointsArr = [];
        points.forEach(point => {
            pointsArr.push(L.latLng(point[0], point[1]));
        });

        console.log(pointsArr.length)
    

		if (map) {            
			L.Routing.control({
			waypoints: pointsArr,
			addWaypoints: false,
			createGeocoder: false,
			routeWhileDragging: false,
			geocoder: L.Control.Geocoder.nominatim(),			
		/* 	createMarker: function (i, waypoint, n) {
				return L.marker(waypoint.latLng, {
					icon: customIcon,
					draggable: false
				}).bindPopup('Waypoint ' + i);
			}, */
			show: false,
		}).addTo(map);
		}
	});

	onDestroy(() => {
		route?.remove();
		route = undefined;
	});

    $: if (points > 0) {
        // Actualiza la posición del marcador cuando cambia latLng
        let pointsArr = [];
        points.forEach(point => {
            pointsArr.push(L.latLng(point[0], point[1]));
        });
    }

</script>

<div class="w-full h-full" bind:this={routeElement}>
	{#if route}
		<slot />
	{/if}
</div>
