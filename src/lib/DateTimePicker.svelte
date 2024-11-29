<script lang="ts">
    import flatpickr from "flatpickr";
    import "flatpickr/dist/flatpickr.min.css";
    import { Spanish } from "flatpickr/dist/l10n/es.js"
    import { onMount } from 'svelte';
  
    export let value: string = "";
    export let holder: string = "";
    export let dateIni: string = "";
    export let onChange: (date: string) => void;
  
    let inputElement: HTMLInputElement;
  
    onMount(() => {
      flatpickr(inputElement, {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        altInput: true,
        locale: Spanish,
        time_24hr: true,
        onChange: (selectedDates) => {
          const formattedDate = selectedDates[0]
            ? flatpickr.formatDate(selectedDates[0], "Y-m-d H:i")
            : "";
          onChange(formattedDate);
        },
      });
    });
  </script>
  
  <input
    bind:this={inputElement}
    class="text-black p-1 rounded-md w-full"
    type="text"
    placeholder={holder}
    value={value}
    readonly
  />
  