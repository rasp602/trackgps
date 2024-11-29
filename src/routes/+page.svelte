<script lang="ts">
	import '../app.css';
	import type { LatLngExpression } from 'leaflet';
	import Leaflet from '$lib/Leaflet.svelte';
	import Marker from '$lib/Marker.svelte';
	import Popup from '$lib/Popup.svelte';
	import { alertStore, showAlert } from '../lib/alertStore';  	
	import Alert from '$lib/Alert.svelte';
	import { onMount } from 'svelte';

	import { goto } from '$app/navigation';

	
	import pin from '$img/pin.png';
	import hist from '$img/historial.png';
	import off from '$img/apagado.png';

	var initialView: LatLngExpression = [0, 0]; // Dortmund, Germany
	function updateInitialView(newLat: number, newLng: number) {
		initialView = [newLat, newLng];
		zoom = 18;
	}
	var zoom = 4;

	/* type MarkerLocation = {
		latLng: [number, number];
		imei: String;
	}; */
	type MarkerLocation = {
		latLng: [number, number];
		imei: String;
		date: String | any;
	};


	var markerLocations: MarkerLocation[] = [];
	interface Location {
		accion: String;
		fecha: Date;
		idregistro: number;
		imei: String;
		lat: number;
		lon: number;
	}



	let datos: any[] = [];

	onMount(() => {
		// Ejecutar fetchData inmediatamente después de montar el componente
		fetchData(1);
		fetchDataTen();

		

		// Configurar un temporizador para que fetchData se ejecute cada 10 segundos
		const intervalId = setInterval(fetchData, 10000);
		const intervalId2 = setInterval(fetchDataTen, 10000);

		return () => {
			clearInterval(intervalId);
			clearInterval(intervalId2);
		};
	});

	async function fetchData(init: number | any | undefined) {
		//const response = await fetch('http://34.125.106.186:3030/lastone');
		//const response = await fetch('http://20.206.201.79:3030/lastone');
		const response = await fetch('http://192.168.1.30:3001/lastone');
		if (response.ok) {
			var data = (await response.json()) as Location[]; // Asume que la respuesta es un arreglo de objetos Location
			console.log(data);

			if (data.length > 0) {
				markerLocations = []; // Limpia el arreglo anterior

				data.forEach((item: Location) => {
					// Aquí se tipa 'item' como Location
					if (item.lat && item.lon) {
						//markerLocations.push({[item.lat, item.lon], description: "test"});
						markerLocations.push({ latLng: [item.lat, item.lon], imei: item.imei, date: item.fecha });
					} else {
						console.error('Los datos recibidos no contienen la latitud y longitud esperadas.');
					}
				});
				if(init == 1){
					initialView = [markerLocations[markerLocations.length - 1].latLng[0], markerLocations[markerLocations.length - 1].latLng[1]];
				}

				// Actualiza el mapa aquí, si es necesario
			} else {
				console.error('Los datos recibidos están vacíos.');
			}
		} else {
			console.error('Error al obtener los datos:', response.statusText);
		}
	}

	async function fetchDataTen() {
		//const response = await fetch('http://34.125.106.186:3030/lastten');
		const response = await fetch('http://152.172.21.163:3001/lastten');
		if (response.ok) {
			datos = await response.json();
			console.log(datos);
		} else {
			console.error('Error al obtener los datos:', response.statusText);
		}
	}

	function getTimeFromISOString(isoString: String | any) {
		const date = new Date(isoString);
		let dateEnd =  isoString.slice(0, 10);
		const hours = String(date.getUTCHours()).padStart(2, '0');
		const minutes = String(date.getUTCMinutes()).padStart(2, '0');
		const seconds = String(date.getUTCSeconds()).padStart(2, '0');
		return `${dateEnd} ${hours}:${minutes}:${seconds}`;
	}

	function isOnline(fechaString: string): boolean {
		// Convertir la cadena de fecha a un objeto Date
		const newDate = fechaString.split('.')[0];
		const fechaRecibida: Date = new Date(newDate);

		// Obtener la fecha y hora actual
		const fechaActual: Date = new Date();

		// Calcular la diferencia en milisegundos
		const diferencia: number = Math.abs(fechaActual.getTime() - fechaRecibida.getTime());

		

		// Convertir la diferencia a segundos
		const diferenciaEnSegundos: number = diferencia / 1000;
		console.log(fechaRecibida, fechaActual, diferencia, diferenciaEnSegundos);
		// Comparar si la diferencia es menor o igual a 10 segundos
		return diferenciaEnSegundos <= 10;
	}

	
	function goToHistoricalMap(imei: string | any, lat: number | any, lon: number | any) {
		const imeiUri = encodeURIComponent(imei);		
		const latUri = encodeURIComponent(lat);		
		const lonUri = encodeURIComponent(lon);		
		goto(`/historial?imei=${imeiUri}&lat=${latUri}&lon=${lonUri}`);
	}

	async function off_Auto(imei: string | any) {
		//const url = new URL('http://34.125.106.186:3030/historial');
		const url = new URL('http://152.172.21.163:3001/off_auto');
		url.searchParams.append('imei', imei);		
		
	}


	function triggerAlert(message: any) {
		showAlert(message);
	}

	

</script>

<!-- <div class="w-80 h-auto p-4 lastten shadow-lg rounded-lg">
    <h2 class="text-lg font-semibold mb-4">Últimas ubicaciones</h2>
    <ul class="list-disc pl-5 space-y-2">
		{#each datos as dato }
			<li><p class="text-red-800 font-bold" >IMEI: {dato.imei}</p> {dato.lat} , {dato.lon}</li>
		{/each}
    </ul>
</div> -->

<div class="w-80 h-auto p-4 lastten shadow-lg rounded-lg">
	<div class="font-bold text-xl mb-4 border-b pb-2">Vehículos</div>
	<div class="space-y-3">
		<div class="space-y-3">
			{#each markerLocations as location}
				<div class="flex items-center flex-col">
					<div class="w-full flex items-center justify-center">
						<!-- <input type="checkbox" checked class="mr-2" /> -->
						{#if isOnline(location.date)}
						<div class="w-2.5 h-2.5 bg-green-500 rounded-full mr-3"></div>
						{:else}
						<div class="w-2.5 h-2.5 bg-red-500 rounded-full mr-3"></div>
						{/if}
						<button on:click={() =>updateInitialView(location.latLng[0],location.latLng[1])} class="flex cursor-pointer text-red-800 font-bold">						
							<span>{location.imei}</span>
						</button>
					</div>
					<div class="w-full flex items-center justify-center mb-3">
						<p class="font-semibold">{location.latLng[0]}, {location.latLng[1]}</p>
					</div>
					<div class="w-full flex mb-5">
						<button
							on:click={() => goToHistoricalMap(location.imei, location.latLng[0], location.latLng[1])}
							class="flex-grow hover:bg-slate-300 border flex justify-center text-white rounded-l p-2"
							><img src={hist} width="20" alt="pin" /></button
						>
						<button
							class="flex-grow hover:bg-slate-300 border flex justify-center text-white rounded-r p-2"
							><img src={off} width="20" alt="pin" /></button
						>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<div class="w-full h-screen">
	<Leaflet view={initialView} {zoom}>
		{#each markerLocations as location}
			<Marker latLng={location.latLng} width={10} height={10}>
				<img src={pin} alt="pin" />
				<Popup
					>Latitud: {location.latLng[0]}
					<br />
					Longitud: {location.latLng[1]}
					<br />
					Imei: {location.imei}
					<br />
					Último registro: {getTimeFromISOString(location.date)}</Popup
				>
			</Marker>
		{/each}
	</Leaflet>
</div>

<style>
	
	.lastten {
		background-color: white;
		position: absolute;
		top: 50px;
		left: 50px;
		z-index: 401;
		font-size: 13px;
	}
	
	/* Ocultar .lastten en dispositivos con una anchura máxima de 768px */
	@media (max-width: 768px) {
		.lastten {
			display: none;
		}
	}
</style>
