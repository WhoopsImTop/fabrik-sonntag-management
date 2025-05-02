<template>
  <div class="relative">
    <AppDialogPoi
      class="absolute top-2 left-2 bottom-2 z-10"
      :poiToEdit="editingObj"
      @start-drawing="handleStartDrawing"
      @save="handleSave"
    />
    <div class="map-container w-full h-full" id="mapContainer"></div>
    <div v-if="isSaving" class="saving-indicator">Speichere Änderungen...</div>
  </div>
</template>

<script>
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import "@watergis/maplibre-gl-export/dist/maplibre-gl-export.css";
import fabrikSonntagStyle from "@/assets/basic.json";
import MaplibreDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

export default {
  data() {
    return {
      map: null,
      draw: null,
      isSaving: false,
      editingObj: null,
    };
  },

  mounted() {
    this.map = new maplibregl.Map({
      container: "mapContainer",
      style: fabrikSonntagStyle,
      center: [7.968404, 48.098452],
      zoom: 16,
    });

    // 2. Initialisiere MaplibreDraw
    this.draw = new MaplibreDraw({
      displayControlsDefault: false, // Nicht alle Controls anzeigen
      controls: {
        polygon: true,
        trash: true,
      },
    });

    this.map.on("load", async () => {
      console.log("Map style loaded.");

      this.map.addControl(new maplibregl.NavigationControl(), "top-right");
      this.map.addControl(this.draw, "top-left");

      await this.loadAndDrawPois();

      this.map.on("draw.update", this.handleDrawUpdate);
      this.map.on("draw.create", this.handleDrawCreate);

      // Optional: Listener für das Erstellen neuer Features (falls erlaubt)
      // this.map.on('draw.create', this.handleDrawCreate);
      // Optional: Listener für das Löschen von Features (falls erlaubt)
      // this.map.on('draw.delete', this.handleDrawDelete);
    });

    this.map.on("error", (e) => {
      console.error("MapLibre Error:", e);
    });
  },

  beforeUnmount() {
    if (this.map) {
      this.map.off("draw.update", this.handleDrawUpdate);
      // this.map.off('draw.create', this.handleDrawCreate);
      // this.map.off('draw.delete', this.handleDrawDelete);
      this.map.remove();
    }
  },

  methods: {
    async loadAndDrawPois() {
      try {
        const response = await fetch("http://localhost:3001/api/pois");
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const apiData = await response.json();
        console.log("API Data received:", apiData);

        if (!apiData || apiData.length === 0) {
          console.log("No POI data to display.");
          return;
        }

        const features = apiData
          .filter(
            (poi) =>
              poi.areaGeoJson &&
              poi.areaGeoJson.geometry &&
              poi.areaGeoJson.geometry.type === "Polygon"
          )
          .map((poi) => {
            const feature = JSON.parse(JSON.stringify(poi.areaGeoJson));
            feature.properties = {
              ...feature.properties,
              poiId: poi.id,
              name: poi.name,
            };
            feature.id = poi.id;
            return feature;
          });

        const geoJsonData = {
          type: "FeatureCollection",
          features: features,
        };

        console.log("Adding GeoJSON to MaplibreDraw:", geoJsonData);

        this.draw.set(geoJsonData);
      } catch (error) {
        console.error("Error loading POIs:", error);
      }
    },

    // 6. Handler für das draw.update Event
    async handleDrawUpdate(e) {
      if (e.features && e.features.length > 0) {
        this.isSaving = true;
        console.log("Feature updated:", e.features);

        const updatedFeature = e.features[0];

        const poiId = updatedFeature.properties.poiId;
        if (!poiId) {
          console.error(
            "Cannot update feature: Missing 'poiId' in feature properties.",
            updatedFeature
          );
          this.isSaving = false;
          alert(
            "Fehler: Konnte das Objekt nicht eindeutig identifizieren. Änderung nicht gespeichert."
          );
          return;
        }
        const updatedGeometry = updatedFeature.geometry;
        const patchData = {
          areaGeoJson: {
            type: "Feature",
            properties: updatedFeature.properties,
            geometry: updatedGeometry,
          },
        };

        console.log(
          `Sending PATCH to /api/pois/${poiId} with data:`,
          patchData
        );

        try {
          const response = await fetch(
            `http://localhost:3001/api/pois/${poiId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(patchData),
            }
          );

          if (!response.ok) {
            let errorBody = null;
            try {
              errorBody = await response.json();
            } catch (e) {}
            console.error(
              "API PATCH request failed:",
              response.status,
              errorBody
            );
            throw new Error(
              `API PATCH request failed with status ${response.status}. ${
                errorBody?.message || ""
              }`
            );
          }

          const result = await response.json();
          console.log("API PATCH successful:", result);
          alert("Änderung erfolgreich gespeichert!");
        } catch (error) {
          console.error("Error sending PATCH request:", error);
          alert(`Fehler beim Speichern der Änderung: ${error.message}`);
        } finally {
          this.isSaving = false;
        }
      }
    },

    handleStartDrawing(mode) {
      if (!this.map || !this.draw) {
        console.warn("Map oder Draw nicht initialisiert.");
        return;
      }

      // Vorherige Zeichnungen löschen, wenn nötig
      this.draw.deleteAll();

      if (mode === "polygon") {
        console.log("Zeichnen eines Polygons starten...");
        this.draw.changeMode("draw_polygon");
      } else if (mode === "point") {
        console.log("Klicken Sie auf die Karte, um einen Punkt zu setzen.");
        this.draw.changeMode("draw_point");
      } else {
        console.warn("Unbekannter Zeichnen-Modus:", mode);
      }
    },

    async handleSave(data) {
      if (this.editingObj != null) {
        try {
          const response = await fetch(
            "http://localhost:3000/api/poi/" + this.editingObj.id,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            }
          );

          if (!response.ok) {
            let errorBody = null;
            try {
              errorBody = await response.json();
            } catch (e) {}
            console.error(
              "API PATCH request failed:",
              response.status,
              errorBody
            );
            throw new Error(
              `API PATCH request failed with status ${response.status}. ${
                errorBody?.message || ""
              }`
            );
          }

          const result = await response.json();
          console.log("API PATCH successful:", result);
          alert("Änderung erfolgreich gespeichert!");
        } catch (error) {
          console.error("Error sending PATCH request:", error);
          alert(`Fehler beim Speichern der Änderung: ${error.message}`);
        } finally {
          this.isSaving = false;
        }
      } else {
        try {
          const response = await fetch("http://localhost:3000/api/poi", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            let errorBody = null;
            try {
              errorBody = await response.json();
            } catch (e) {}
            console.error(
              "API PATCH request failed:",
              response.status,
              errorBody
            );
            throw new Error(
              `API PATCH request failed with status ${response.status}. ${
                errorBody?.message || ""
              }`
            );
          }

          const result = await response.json();
          console.log("API PATCH successful:", result);
          alert("Änderung erfolgreich gespeichert!");
        } catch (error) {
          console.error("Error sending PATCH request:", error);
          alert(`Fehler beim Speichern der Änderung: ${error.message}`);
        } finally {
          this.isSaving = false;
        }
      }
    },

    handleDrawCreate(e) {
      const feature = e.features[0];
      console.log("Neues Feature erstellt:", feature);

      // Optional: Hier könntest du `emit` an den Dialog senden oder eine API-POST-Anfrage absetzen
      alert("Neues Objekt erstellt: " + JSON.stringify(feature));
    },
  },
};
</script>

<style>
.map-container {
  width: 100%;
  height: calc(100vh - 80px);
}

.maplibregl-ctrl-group button .maplibregl-ctrl-icon {
  background-color: white;
}
</style>
