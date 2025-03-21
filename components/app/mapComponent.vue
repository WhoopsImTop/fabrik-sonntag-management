<template>
  <div class="map-container w-full h-full" id="mapContainer"></div>
</template>

<script>
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import "@watergis/maplibre-gl-export/dist/maplibre-gl-export.css";

export default {
  data() {
    return {
      map: null,
    };
  },

  mounted() {
    this.map = new maplibregl.Map({
      container: "mapContainer",
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [7.968404, 48.098452],
      zoom: 17,
    });

    this.map.on("load", async () => {
      await this.map.addControl(
        new maplibregl.NavigationControl(),
        "top-right"
      );
    });
  },
};
</script>

<style></style>
