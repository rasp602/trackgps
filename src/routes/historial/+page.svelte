<!-- src/routes/historical-map.svelte -->
<script lang="ts">
	import '../../app.css';
	import { onMount } from 'svelte';
	import type { LatLngExpression } from 'leaflet';
	import Leaflet from '$lib/Leaflet.svelte';
	import Marker from '$lib/Marker.svelte';
	import Loading from '$lib/Loading.svelte'; 
	import Popup from '$lib/Popup.svelte';
	import Line from '$lib/Line.svelte';
	import Route from '$lib/Route.svelte';
	import { page } from '$app/stores';
	import { get } from 'svelte/store';
	import { writable } from 'svelte/store';
	import DateTimePicker from '$lib/DateTimePicker.svelte';

	import { goto } from '$app/navigation';

	import pin from '$img/pin.png';
	import home from '$img/home.png';

	import { alertStore, showAlert } from '../../lib/alertStore';  	
	import Alert from '$lib/Alert.svelte';
	import { onDestroy } from 'svelte';
  	
	let alertMessage = '';
	let alertVisible = false;

	const unsubscribe = alertStore.subscribe(value => {
		alertMessage = value.message;
		alertVisible = value.visible;
	});

	onDestroy(() => {
		unsubscribe();
	});

	function triggerAlert(message: any) {
		showAlert(message);
	}

	var zoom = 16;
	const url = get(page).url;
	const imei: string | any = url.searchParams.get('imei');
	var lat: number | any = url.searchParams.get('lat');
	var lon: number | any = url.searchParams.get('lon');
	var initialView: LatLngExpression = [lat, lon]; // Dortmund, Germany
	let rangeValue = 0; // Valor inicial del input range
	let maxValue = 0; // Valor máximo del input range
	const showFilters = writable(false);
	let startDate: string = '';
	let endDate: string = '';

	let isLoading = false;

	type MarkerLocation = {
		latLng: [number, number];
		imei: String;
		date: String | any;
		vel: String | any;
	};

	interface Location {
		accion: String;
		fecha: String | any;
		idregistro: number;
		imei: String;
		lat: number;
		lon: number;
		vel: number;
	}

	var markerLocations: MarkerLocation[] = [];
	var markerShows: MarkerLocation[] = [];

	onMount(() => {				
		const today = new Date();
		fetchData();		
		const intervalId = setInterval(fetchData, 500);

		return () => {
			clearInterval(intervalId);
		};
	});

	function decrement() {
		if (rangeValue > 0) {
			rangeValue -= 1;
			markerShows.pop();
		}
		updateInitialView(markerLocations[rangeValue].latLng[0], markerLocations[rangeValue].latLng[1]);
	}

	function gotoMarker(position: number){
		rangeValue = position;
	}

	async function increment() {
		if (rangeValue < maxValue) {
			markerShows.push({
				latLng: markerLocations[rangeValue].latLng,
				imei: markerLocations[rangeValue].imei,
				date: markerLocations[rangeValue].date,
				vel: markerLocations[rangeValue].vel, 
			});
			
			updateInitialView(
				markerLocations[rangeValue].latLng[0],
				markerLocations[rangeValue].latLng[1]
			);
			rangeValue += 1;
		}
	}

	function updateInitialView(newLat: number, newLng: number) {
		initialView = [newLat, newLng];
		zoom = 18;
	}

	function showMarkers() {		
		updateInitialView(markerLocations[rangeValue - 1].latLng[0], markerLocations[rangeValue - 1].latLng[1]);
	}

	function toggleFilters() {
		showFilters.update((n) => !n);
	}

	async function handleFilter() {
		// Aquí puedes agregar tu lógica para filtrar las ubicaciones por fecha
		if (startDate == '' || endDate == '') {			
			triggerAlert("Es neceseario seleccionar ambas fechas");
			return;
		}
		markerLocations = [];
		markerShows = [];
		maxValue = 0;
		
		await fetchDataHist();
		updateInitialView(markerLocations[0].latLng[0], markerLocations[0].latLng[1]);
	}

	function getTimeFromISOString(isoString: String | any) {
		const date = new Date(isoString);
		const hours = String(date.getUTCHours()).padStart(2, '0');
		const minutes = String(date.getUTCMinutes()).padStart(2, '0');
		const seconds = String(date.getUTCSeconds()).padStart(2, '0');

		return `${hours}:${minutes}:${seconds}`;
	}

	async function fetchDataHist() {
		//const url = new URL('http://34.125.106.186:3030/historial');
		const url = new URL('http://192.168.1.30:3001/historial');
		url.searchParams.append('imei', imei);
		url.searchParams.append('startDate', startDate);
		url.searchParams.append('endDate', endDate);
		isLoading = true; 

		rangeValue = 0;		

		const response = await fetch(url);
		if (response.ok) {			
			var data = (await response.json()) as Location[]; // Asume que la respuesta es un arreglo de objetos Locatio

			if (data.length > 0) {
				markerLocations = []; // Limpia el arreglo anterior
				console.log(data);
				maxValue = data.length;

				data.forEach(async (item: Location) => {
					// Aquí se tipa 'item' como Location
					if (item.lat && item.lon) {
						//markerLocations.push({[item.lat, item.lon], description: "test"});
						markerLocations.push({
							latLng: [item.lat, item.lon],
							imei: item.imei,
							date: getTimeFromISOString(item.fecha),
							vel: item.vel, 
						});
						//points.push([item.lat, item.lon]);
					} else {
						console.error('Los datos recibidos no contienen la latitud y longitud esperadas.');
					}
				});
				isLoading = false; 

				// Actualiza el mapa aquí, si es necesario
			} else {
				console.error('Los datos recibidos están vacíos.');
				maxValue = 0;
				isLoading = false; 
				triggerAlert("No hay datos que mostrar");
			}
		} else {
			console.error('Error al obtener los datos:', response.statusText);
			isLoading = false; 
			triggerAlert("Error al mostrar los datos");
		}
	}



	function goToHome() {
		goto(`/`);
	}

	async function fetchData() {
		if (rangeValue < 1) {
			markerShows = []; // Lim
			return;
		}
		
		if (markerLocations.length > 0) {
			markerShows = []; // Limpia el arreglo anterior

			for (var i = 0; i < rangeValue; i++) {
				// Aquí se tipa 'item' como Location
				if (markerLocations[i].latLng[0] && markerLocations[i].latLng[1]) {
					//markerLocations.push({[item.lat, item.lon], description: "test"});
					markerShows.push({
						latLng: [markerLocations[i].latLng[0], markerLocations[i].latLng[1]],
						imei: markerLocations[i].imei,
						date: markerLocations[i].date,
						vel: markerLocations[i].vel, 
					});
					//points.push([markerLocations[i].latLng[0], markerLocations[i].latLng[1]]);
				} else {
					console.error('Los datos recibidos no contienen la latitud y longitud esperadas.');
				}
			}
			console.log(rangeValue);
			updateInitialView(markerLocations[rangeValue - 1].latLng[0], markerLocations[rangeValue - 1].latLng[1]);
			//updateInitialView(markerLocations[rangeValue - 1].latLng[0], markerLocations[rangeValue - 1].latLng[1]);
			// Actualiza el mapa aquí, si es necesario
		} else {
			console.error('Los datos recibidos están vacíos.');
		}
	}
</script>

<nav class="bg-gray-800 text-white p-4 flex justify-between items-center">
	<div class="flex items-center">
		<button on:click={goToHome} class="text-l font-semibold flex justify-center"
			><img src={home} width="20" alt="pin" /></button
		>
		<span class="w-[20px]" />
		<div class="text-lg font-semibold">
			Histórico de Ubicaciones del vehiculo <span class="text-green-300">{imei}</span>
		</div>
	</div>
	<div class="hidden md:flex space-x-4">
		<div class="flex flex-col">
			<label for="start-date" class="text-sm">De la fecha</label>
			<DateTimePicker
				holder="Seleccione incio"
				bind:value={startDate}
				onChange={(date) => (startDate = date)}
			/>
		</div>
		<div class="flex flex-col">
			<label for="end-date" class="text-sm">Hasta la fecha</label>
			<DateTimePicker
				holder="Seleccione termino"
				bind:value={endDate}
				onChange={(date) => (endDate = date)}
			/>
		</div>
		<button
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			on:click={handleFilter}>Filtrar</button
		>
	</div>
	<div class="md:hidden">
		<button on:click={toggleFilters} class="focus:outline-none">
			<svg
				class="w-6 h-6"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M4 6h16M4 12h16m-7 6h7"
				/>
			</svg>
		</button>
	</div>
</nav>

{#if $showFilters}
	<div class="md:hidden bg-gray-800 text-white p-4 flex flex-col space-y-4">
		<div class="flex flex-col">
			<label for="start-date-mobile" class="text-sm">De la fecha</label>
			<DateTimePicker bind:value={startDate} onChange={(date) => (startDate = date)} />
		</div>
		<div class="flex flex-col">
			<label for="end-date-mobile" class="text-sm">Hasta la fecha</label>
			<DateTimePicker bind:value={endDate} onChange={(date) => (endDate = date)} />
		</div>
		<button
			class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			on:click={handleFilter}>Filtrar</button
		>
	</div>
{/if}

<div class="relative z-[401] bg-gray-100" class:invisible={maxValue <= 0}>
	<!-- Contenido existente de tu página -->
	<!-- Div flotante con input range y botones -->
	<div
		class="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[700px] h-[100px] bg-white rounded-lg shadow-lg flex items-center justify-between p-4"
	>
		<button
			class="rounded-full px-4 py-2"
			class:bg-gray-800={rangeValue > 0}
			class:bg-gray-400={rangeValue === 0}
			class:text-white={rangeValue > 0}
			class:text-gray-600={rangeValue === 0}
			class:cursor-not-allowed={rangeValue === 0}
			class:cursor-pointer={rangeValue > 0}
			on:click={decrement}
			disabled={rangeValue === 0}
		>
			Atras
		</button>
		<div class="flex flex-col items-center w-full mx-4">
			<label class="mb-2 text-lg font-bold">{rangeValue} de {maxValue}</label>
			<input
				on:change={showMarkers}
				type="range"
				bind:value={rangeValue}
				min="0"
				max={maxValue}
				class="w-full"
			/>
		</div>
		<button
			class="rounded-full px-4 py-2"
			class:bg-gray-800={rangeValue < maxValue}
			class:bg-gray-400={rangeValue === maxValue}
			class:text-white={rangeValue < maxValue}
			class:text-gray-600={rangeValue === maxValue}
			class:cursor-not-allowed={rangeValue === maxValue}
			class:cursor-pointer={rangeValue < maxValue}
			on:click={increment}
			disabled={rangeValue === maxValue}
		>
			Sig.
		</button>
	</div>
</div>

<div class="w-96 max-h-[700px] h-auto p-4 lastten shadow-lg rounded-lg" class:invisible={maxValue <= 0}>
	<div class="font-bold text-center text-xl mb-4 border-b pb-2">Ruta del vehiculo </div>
	<div class="space-y-3 h-[600px] overflow-auto">

		{#each markerLocations as location, index}
			<div class="flex w-full flex-row">
				<div class="w-1/5	">
					<button on:click={() => gotoMarker((index + 1))} class="w-full h-full flex items-center justify-center text-center hover:bg-slate-300 border rounded-l p-2">{index + 1}</button>
				</div>
				<div class="w-4/5 flex ms-4 items-center flex-col">
					<span class="text-red-800 font-bold text-xs">{location.latLng[0]},{location.latLng[1]}</span>
					<div class="w-full flex flex-col mt-1">
						<div class="w-full flex items-center mb-3">
							<p class="leading-none font-semibold"> <b>{location.date}</b> a <b>{location.vel} km/hr</b></p>				
						</div>
					</div>
				</div>
			</div>			
		{/each}
		
		
	</div>
</div>
{#if isLoading}
	<Loading />
{/if}
<Alert message={alertMessage} visible={alertVisible} />
<div id="map">
	
	<Leaflet view={initialView} {zoom}>
		<!-- 		{#if points.length > 0}
			<Route points={points}/>
		{/if} -->
		
		{#each markerShows as location, index}
			{#if index < markerShows.length - 1}
				<Line colorbg="red" latLngC1={location.latLng} latLngC2={markerShows[index + 1].latLng} />
			{/if}|

			
		{/each}
		{#if markerShows.length > 0 && rangeValue > 0 && markerShows[rangeValue - 1]}
		<Marker latLng={markerShows[rangeValue - 1].latLng} width={20} height={20}>
			<img src={pin} alt="pin" class="marker" />
							<!-- <Popup
					>Latitud: {location.latLng[0]}
					<br />
					Longitud: {location.latLng[1]}
					<br />
					Fecha: {location.date}
				</Popup> -->

		</Marker>
		{/if}
		{#each markerLocations as location, index}
			{#if index < markerLocations.length - 1}
				<Line colorbg="grey" latLngC1={location.latLng} latLngC2={markerLocations[index + 1].latLng} />
			{/if}
		{/each}
	</Leaflet>	
</div>

<style>
	#map {
		height: calc(100vh - 90px); /* Ajusta la altura para el nav */
		cursor: n;
	}
	.marker {
		width: 25px;
		height: 25px;
	}
	.lastten {
		background-color: white;
		position: absolute;
		top: 100px;
		left: 50px;
		z-index: 401;
		font-size: 13px;
	}
</style>
