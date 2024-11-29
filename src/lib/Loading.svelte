<script>
    	import load from '$img/loading.gif';
</script>
<style>
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      height: calc(100% - 90px);
      width: 100%;
      font-size: 2em;
      z-index: 701;
      background-color: rgba(0, 0, 0, .5);
      position: absolute;
    }
  </style>
  
  <div class="loading">
    <img src="{load}" alt="load" width="250px">
    <span class="text-white text-xl">Cargando datos...</span>
  </div>
  