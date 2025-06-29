<template>
  <div class="relative h-full w-full">
    <AppDialogPoi
      v-if="isModalVisible"
      class="absolute top-2 left-2 bottom-2 z-10 w-96"
      :poiToEdit="editingObj"
      :isGeometryEditMode="isGeometryEditMode"
      @start-drawing="handleStartDrawing"
      @save="handleSave"
      @cancel="handleCancelEdit"
      @edit-position="handleEditPositionStart"
      @create-new="handleCreateNew"
    />
    <div class="map-container w-full h-full" id="mapContainer"></div>
    <div
      v-if="isSaving"
      class="saving-indicator absolute bottom-4 right-4 bg-blue-500 text-white p-2 rounded shadow-md z-20"
    >
      Speichere Änderungen...
    </div>
    <div
      class="absolute bottom-2 right-2 flex items-center gap-2 bg-white shadow-sm rounded-lg p-2 z-10"
    >
      <UTooltip text="Karte Editieren">
        <button
          @click="toggleEditingMode"
          class="bg-white p-1 rounded-md border border-neutral-200 flex items-center justify-center aspect-square"
        >
          <UIcon name="i-lucide-pencil" class="size-6"></UIcon>
        </button>
      </UTooltip>
      <UTooltip text="Eintrag in Karte hinzufügen">
        <button
          v-if="isEditingMode"
          @click="handleCreateNew"
          class="bg-white p-1 rounded-md border border-neutral-200 flex items-center justify-center aspect-square"
        >
          <UIcon name="i-lucide-map-pin-plus" class="size-6"></UIcon>
        </button>
      </UTooltip>
      <UTooltip text="Karte als PDF exportieren">
        <button
          @click="exportMap"
          class="bg-white p-1 rounded-md border border-neutral-200 flex items-center justify-center aspect-square"
          :disabled="isExporting"
        >
          <UIcon
            :name="isExporting ? 'i-lucide-loader-2' : 'i-lucide-download'"
            class="size-6"
            :class="{ 'animate-spin': isExporting }"
          >
          </UIcon>
        </button>
      </UTooltip>
    </div>
  </div>
</template>

<script>
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import "@watergis/maplibre-gl-export/dist/maplibre-gl-export.css"; // Falls Export benötigt wird
import fabrikSonntagStyle from "@/assets/basic.json";
import MaplibreDraw from "@mapbox/mapbox-gl-draw";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

// Eindeutige IDs für Source und Layer
const POI_SOURCE_ID = "poi-display-source";
const POI_LAYER_ID = "poi-display-layer";

export default {
  data() {
    return {
      map: null,
      draw: null,
      isSaving: false,
      isModalVisible: false,
      isEditingPosition: false,
      currentDrawFeatureId: null,
      allPoisData: [],
      editingObj: this.createEmptyEditingObject(),
      isEditingMode: false,
      changesHappened: false,
      isGeometryEditMode: false,
      isDrawingNew: false,
      isExporting: false,
    };
  },

  mounted() {
    this.map = new maplibregl.Map({
      container: "mapContainer",
      style: fabrikSonntagStyle,
      center: [7.968404, 48.098452],
      zoom: 18,
    });

    this.draw = new MaplibreDraw({
      displayControlsDefault: false,
      controls: {
        point: true,
        polygon: true,
        trash: true,
      },
      defaultMode: "simple_select",
      clickBuffer: 4,
      touchBuffer: 25,
      styles: [
        // Aktive Punkte im Bearbeitungsmodus
        {
          id: "gl-draw-point-active",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "active", "true"]],
          paint: {
            "circle-radius": 7,
            "circle-color": "#ff9800",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        },
        // Inaktive Punkte
        {
          id: "gl-draw-point",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "active", "false"]],
          paint: {
            "circle-radius": 5,
            "circle-color": "#ff9800",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        },
        // Aktive Polygon Fill
        {
          id: "gl-draw-polygon-fill-active",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
          paint: {
            "fill-color": "#cccccc",
            "fill-outline-color": "#ff9800",
            "fill-opacity": 0.4,
          },
        },
        // Inaktive Polygon Fill
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: [
            "all",
            ["==", "$type", "Polygon"],
            ["==", "active", "false"],
          ],
          paint: {
            "fill-color": "#cccccc",
            "fill-outline-color": "#ff9800",
            "fill-opacity": 0.2,
          },
        },
        // Polygon Stroke - für aktive Bearbeitung
        {
          id: "gl-draw-polygon-stroke-active",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["==", "active", "true"]],
          paint: {
            "line-color": "#ff9800",
            "line-width": 3,
          },
        },
        // Polygon Stroke - für inaktive Polygone
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          filter: [
            "all",
            ["==", "$type", "Polygon"],
            ["==", "active", "false"],
          ],
          paint: {
            "line-color": "#ff9800",
            "line-width": 2,
          },
        },
        // Vertices - Eckpunkte für die Bearbeitung
        {
          id: "gl-draw-polygon-and-line-vertex-active",
          type: "circle",
          filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
          paint: {
            "circle-radius": 6,
            "circle-color": "#fff",
            "circle-stroke-color": "#ff9800",
            "circle-stroke-width": 2,
          },
        },
      ],
    });

    this.map.on("load", async () => {
      console.log("Map style loaded.");

      this.map.addControl(new maplibregl.NavigationControl(), "top-right");
      this.map.addControl(this.draw, "top-left"); // Draw hinzufügen, aber initial leer

      // Quelle für die POI-Anzeige hinzufügen (initial leer)
      this.map.addSource(POI_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // Layer für die POI-Anzeige hinzufügen
      // Marker Layer für Punkte
      this.map.addLayer({
        id: POI_LAYER_ID,
        type: "symbol",
        source: POI_SOURCE_ID,
        filter: ["==", "$type", "Point"],
        layout: {
          "icon-image": "marker",
          "icon-size": 0.5,
          "icon-allow-overlap": true,
          "text-field": ["get", "shortName"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 24,
          "text-offset": [0, -0.9],
          "text-anchor": "top",
          "text-allow-overlap": true,
          "text-max-width": 8,
        },
        paint: {
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      });

      // Layer für Polygone und Areas
      this.map.addLayer({
        id: "poi-area-layer",
        type: "fill",
        source: POI_SOURCE_ID,
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": "#cccccc",
          "fill-opacity": 0.4,
        },
      });

      // Outline für Polygone
      this.map.addLayer({
        id: "poi-area-outline",
        type: "line",
        source: POI_SOURCE_ID,
        filter: ["==", "$type", "Polygon"],
        paint: {
          "line-color": "#ff9800",
          "line-width": 2,
        },
      });

      // Lade das Marker-Bild
      fetch("/marker.svg")
        .then((response) => response.blob())
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            if (!this.map.hasImage("marker")) {
              this.map.addImage("marker", img);
              URL.revokeObjectURL(url);
            }
          };
          img.src = url;
        })
        .catch((error) => console.error("Error loading marker image:", error));

      // Klick-Listener für alle Layer hinzufügen
      const poiLayers = [POI_LAYER_ID, "poi-area-layer"];
      poiLayers.forEach((layerId) => {
        this.map.on("click", layerId, this.handlePoiClick);
        this.map.on("mouseenter", layerId, () => {
          this.map.getCanvas().style.cursor = "pointer";
        });
        this.map.on("mouseleave", layerId, () => {
          this.map.getCanvas().style.cursor = "";
        });
      });

      // Draw Event Listener
      this.map.on("draw.create", this.handleDrawCreate);
      this.map.on("draw.update", this.handleDrawUpdate);

      // Add area calculation listener
      this.map.on("draw.create draw.update", (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          if (feature.geometry.type === "Polygon") {
            const area = this.calculateArea(feature);
            console.log(`Fläche: ${area.toFixed(2)} m²`);
            // Show area in a small overlay
            this.showAreaOverlay(area);
          }
        }
      });

      await this.loadAndDisplayPois(); // POIs laden und in der Anzeige-Layer darstellen
    });

    this.map.on("error", (e) => {
      console.error("MapLibre Error:", e);
    });

    this.map.on("draw.modechange", (e) => {
      if (e.mode === "draw_polygon") {
        this.map.doubleClickZoom.disable();
      } else {
        this.map.doubleClickZoom.enable();
      }
    });
  },

  beforeUnmount() {
    if (this.map) {
      // Event Listener entfernen
      this.map.off("click", POI_LAYER_ID, this.handlePoiClick);
      this.map.off("mouseenter", POI_LAYER_ID);
      this.map.off("mouseleave", POI_LAYER_ID);
      this.map.off("draw.create", this.handleDrawCreate);
      this.map.off("draw.update", this.handleDrawUpdate);

      // Map-Instanz zerstören
      this.map.remove();
      this.map = null;
    }
  },

  methods: {
    createEmptyEditingObject() {
      return {
        id: null, // Wichtig für Unterscheidung neu/bearbeiten
        address: "",
        areaGeoJson: null, // Hier wird die GeoJSON-Geometrie gespeichert
        directionDescription: "",
        iconId: null,
        name: "",
        poiType: "",
        shortName: "",
        marketingImages: [],
        // Füge ggf. weitere Felder hinzu
      };
    },

    async loadAndDisplayPois() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_INTERNAL_API_URL}/pois`
        );
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const apiData = await response.json();
        console.log("API Data received:", apiData);

        this.allPoisData = apiData;

        if (!apiData || apiData.length === 0) {
          console.log("No POI data to display.");
          if (this.map.getSource(POI_SOURCE_ID)) {
            this.map
              .getSource(POI_SOURCE_ID)
              .setData({ type: "FeatureCollection", features: [] });
          }
          return;
        }

        // Konvertiere API-Daten in GeoJSON Features für die Anzeige-Layer
        const features = apiData
          .filter((poi) => poi.areaGeoJson && poi.areaGeoJson.geometry)
          .map((poi) => ({
            ...poi.areaGeoJson,
            properties: {
              ...poi.areaGeoJson.properties,
              poiId: poi.id,
              name: poi.name,
              shortName: poi.shortName,
              operator: poi.operator,
            },
          }));

        const geoJsonData = {
          type: "FeatureCollection",
          features: features,
        };

        console.log("Updating POI display source:", geoJsonData);

        if (this.map.getSource(POI_SOURCE_ID)) {
          this.map.getSource(POI_SOURCE_ID).setData(geoJsonData);
        }
      } catch (error) {
        console.error("Error loading POIs:", error);
      }
    },

    // --- Modal und Bearbeitungslogik ---

    handlePoiClick(e) {
      if (this.isEditingPosition) return; // Nicht interagieren, wenn gerade Position bearbeitet wird

      if (e.features && e.features.length > 0) {
        const clickedFeature = e.features[0];
        const poiId = clickedFeature.properties.poiId;

        console.log(`POI clicked: ID ${poiId}`);

        // Finde die vollständigen Daten zum geklickten POI
        const poiData = this.allPoisData.find((poi) => poi.id === poiId);
        if (poiData) {
          console.log("POIDATA:", poiData);
          // Setze das editingObj mit den Daten des geklickten POIs
          this.editingObj = {
            id: poiData.id,
            address: poiData.address || "",
            areaGeoJson: poiData.areaGeoJson, // GeoJSON speichern
            directionDescription: poiData.directionDescription || "",
            iconId: poiData.iconId || null,
            name: poiData.name || "",
            operator: poiData.operator || "",
            poiType: poiData.poiType || "",
            shortName: poiData.shortName || "",
            marketingImages: poiData.marketingImages || [],
          };
          this.isModalVisible = true; // Modal öffnen
          this.isEditingPosition = false; // Sicherstellen, dass Positionsbearbeitung aus ist
          this.cleanupDraw(); // Sicherstellen, dass Draw leer ist
        } else {
          console.error(`Could not find full data for POI ID ${poiId}`);
        }
      }
    },

    handleCreateNew() {
      console.log("Create New POI requested");
      this.editingObj = this.createEmptyEditingObject(); // Leeres Objekt für neuen POI
      this.isModalVisible = true;
      this.isEditingPosition = false;
      this.cleanupDraw();
      // Optional: Direkt Zeichenmodus starten? Oder Button im Modal dafür?
      // this.handleStartDrawing('point'); // z.B. direkt Punktzeichnung starten
    },

    handleCancelEdit() {
      console.log("Edit cancelled");
      this.isModalVisible = false;
      this.isGeometryEditMode = false;
      this.isDrawingNew = false;
      this.cleanupEditMode();
      this.editingObj = this.createEmptyEditingObject();
    },

    handleEditPositionStart() {
      if (
        !this.editingObj ||
        !this.editingObj.areaGeoJson ||
        !this.editingObj.id
      ) {
        console.error(
          "Cannot edit position: No valid POI loaded in editingObj."
        );
        return;
      }

      this.isGeometryEditMode = !this.isGeometryEditMode;
      console.log(
        `Geometry edit mode: ${
          this.isGeometryEditMode ? "enabled" : "disabled"
        } for POI ID: ${this.editingObj.id}`
      );

      if (this.isGeometryEditMode) {
        // Aktiviere Bearbeitung
        this.isEditingPosition = true;

        // Nur für Polygone den Filter setzen
        if (this.editingObj.areaGeoJson.geometry.type === "Polygon") {
          this.map.setFilter("poi-area-layer", [
            "!=",
            ["get", "poiId"],
            this.editingObj.id,
          ]);
          this.map.setFilter("poi-area-outline", [
            "!=",
            ["get", "poiId"],
            this.editingObj.id,
          ]);
        }

        // Feature zu MapboxDraw hinzufügen
        const featureToAdd = JSON.parse(
          JSON.stringify(this.editingObj.areaGeoJson)
        );
        featureToAdd.properties = {
          ...(featureToAdd.properties || {}),
          poiId: this.editingObj.id,
        };
        const addedFeatures = this.draw.add(featureToAdd);
        if (addedFeatures && addedFeatures.length > 0) {
          this.currentDrawFeatureId = addedFeatures[0];

          // Für Punkte und Polygone unterschiedliche Modi verwenden
          const mode =
            this.editingObj.areaGeoJson.geometry.type === "Point"
              ? "simple_select"
              : "direct_select";
          this.draw.changeMode(mode, {
            featureId: this.currentDrawFeatureId,
          });
        }
      } else {
        // Deaktiviere Bearbeitung und speichere die aktuelle Geometrie
        if (this.currentDrawFeatureId) {
          const updatedFeature = this.draw.get(this.currentDrawFeatureId);
          if (updatedFeature) {
            // Aktualisiere die Geometrie im editingObj
            this.editingObj.areaGeoJson = {
              type: "Feature",
              properties: updatedFeature.properties,
              geometry: updatedFeature.geometry,
            };

            // Aktualisiere auch in allPoisData
            const poiIndex = this.allPoisData.findIndex(
              (poi) => poi.id === this.editingObj.id
            );
            if (poiIndex !== -1) {
              this.allPoisData[poiIndex] = {
                ...this.allPoisData[poiIndex],
                areaGeoJson: this.editingObj.areaGeoJson,
              };
            }

            // Aktualisiere die Anzeige sofort
            const geoJsonData = {
              type: "FeatureCollection",
              features: this.allPoisData.map((poi) => ({
                ...poi.areaGeoJson,
                properties: {
                  ...poi.areaGeoJson.properties,
                  poiId: poi.id,
                  name: poi.name,
                  shortName: poi.shortName,
                  operator: poi.operator,
                },
              })),
            };

            // Aktualisiere die Datenquelle
            if (this.map.getSource(POI_SOURCE_ID)) {
              this.map.getSource(POI_SOURCE_ID).setData(geoJsonData);
            }
          }
        }

        // Cleanup
        this.cleanupEditMode();
        // Filter zurücksetzen
        this.map.setFilter("poi-area-layer", null);
        this.map.setFilter("poi-area-outline", null);
      }
    },

    // Wird aufgerufen, wenn die Geometrie im Draw *verändert* wurde
    async handleDrawUpdate(e) {
      if (!this.isEditingPosition || !e.features || e.features.length === 0) {
        return;
      }

      const updatedFeature = e.features[0];
      if (updatedFeature.id !== this.currentDrawFeatureId) {
        console.warn(
          "Draw update event for unexpected feature:",
          updatedFeature.id
        );
        return;
      }

      // Aktualisiere die Geometrie im editingObj
      this.editingObj.areaGeoJson = {
        type: "Feature",
        properties: updatedFeature.properties,
        geometry: updatedFeature.geometry,
      };

      // Optional: Speichern Sie die Änderungen sofort auf dem Server
      this.isSaving = true;
      try {
        const response = await fetch(
          `${import.meta.env.VITE_INTERNAL_API_URL}/pois/${this.editingObj.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
            body: JSON.stringify({
              areaGeoJson: this.editingObj.areaGeoJson,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        // Aktualisiere allPoisData und die Anzeige
        const poiIndex = this.allPoisData.findIndex(
          (poi) => poi.id === this.editingObj.id
        );
        if (poiIndex !== -1) {
          this.allPoisData[poiIndex] = {
            ...this.allPoisData[poiIndex],
            areaGeoJson: this.editingObj.areaGeoJson,
          };
        }
      } catch (error) {
        console.error("Error updating geometry:", error);
        alert("Fehler beim Speichern der Geometrie-Änderung");
      } finally {
        this.isSaving = false;
      }
    },

    // Wird aufgerufen, wenn eine *neue* Geometrie im Draw *erstellt* wurde
    handleDrawCreate(e) {
      console.log("Draw create event:", e);

      if (!e.features || e.features.length === 0 || !this.isDrawingNew) {
        console.log("Ignoring invalid draw create event");
        return;
      }

      if (!this.isModalVisible || this.editingObj.id !== null) {
        console.warn("draw.create triggered in invalid state");
        this.draw.delete(e.features.map((f) => f.id));
        return;
      }

      const newFeature = e.features[0];
      if (!newFeature || !newFeature.geometry) {
        console.warn("Invalid feature created");
        return;
      }

      if (this.currentDrawFeatureId === newFeature.id) {
        console.log("Ignoring duplicate feature");
        return;
      }
      this.currentDrawFeatureId = newFeature.id;

      console.log("New geometry created:", newFeature);

      // Stelle sicher, dass die Geometrie korrekt gesetzt wird
      this.editingObj.areaGeoJson = {
        type: "Feature",
        properties: {},
        geometry: {
          type: newFeature.geometry.type,
          coordinates: JSON.parse(
            JSON.stringify(newFeature.geometry.coordinates)
          ),
        },
      };

      console.log("Updated editingObj with new geometry:", this.editingObj);

      this.draw.changeMode("simple_select", { featureId: newFeature.id });
      this.map.doubleClickZoom.enable();
      this.isDrawingNew = false;
    },

    // Wird vom Modal aufgerufen, um das Zeichnen für einen *neuen* POI zu starten
    handleStartDrawing(mode) {
      if (!this.map || !this.draw) return;
      if (this.editingObj.id !== null) {
        console.warn(
          "Drawing should only be started for new POIs via this method."
        );
        return;
      }

      // Vorherige Zeichnungen in Draw löschen
      this.draw.deleteAll();
      this.editingObj.areaGeoJson = null;
      this.isDrawingNew = true;

      if (mode === "point") {
        console.log("Starting to draw a point for new POI...");
        this.draw.changeMode("draw_point");
      } else if (mode === "polygon") {
        console.log("Starting to draw a polygon for new POI...");
        this.map.doubleClickZoom.disable();
        this.draw.changeMode("draw_polygon");
      }
    },

    // Speichert die Daten aus dem Modal (Metadaten und ggf. neue Geometrie)
    async handleSave(poiDataFromModal) {
      console.log("Save triggered with modal data:", poiDataFromModal);

      // Prüfe, ob eine Geometrie vorhanden ist
      if (
        !this.editingObj.areaGeoJson ||
        !this.editingObj.areaGeoJson.geometry
      ) {
        console.error("No geometry data available for saving", this.editingObj);
        alert("Bitte legen Sie zuerst eine Position auf der Karte fest.");
        return;
      }

      this.isSaving = true;

      try {
        // Kombiniere Modal-Daten mit der Geometrie
        const dataToSend = {
          ...poiDataFromModal,
          areaGeoJson: this.editingObj.areaGeoJson,
        };

        console.log("Sending data to API:", dataToSend);

        let response;
        if (this.editingObj.id) {
          // Update existierenden POI
          response = await fetch(
            `${import.meta.env.VITE_INTERNAL_API_URL}/pois/${
              this.editingObj.id
            }`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
              },
              body: JSON.stringify(dataToSend),
            }
          );
        } else {
          // Erstelle neuen POI
          response = await fetch(
            `${import.meta.env.VITE_INTERNAL_API_URL}/pois`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("jwt")}`,
              },
              body: JSON.stringify(dataToSend),
            }
          );
        }

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const result = await response.json();
        console.log("API save successful:", result);

        // Aktualisiere die lokalen Daten
        if (this.editingObj.id) {
          // Update in allPoisData
          const index = this.allPoisData.findIndex(
            (poi) => poi.id === this.editingObj.id
          );
          if (index !== -1) {
            this.allPoisData[index] = result;
          }
        } else {
          // Füge neuen POI hinzu
          this.allPoisData.push(result);
        }

        // Aktualisiere die Kartenanzeige
        const geoJsonData = {
          type: "FeatureCollection",
          features: this.allPoisData.map((poi) => ({
            ...poi.areaGeoJson,
            properties: {
              ...poi.areaGeoJson.properties,
              poiId: poi.id,
              name: poi.name,
              shortName: poi.shortName,
              operator: poi.operator,
            },
          })),
        };

        if (this.map.getSource(POI_SOURCE_ID)) {
          this.map.getSource(POI_SOURCE_ID).setData(geoJsonData);
        }

        // Cleanup
        this.isModalVisible = false;
        this.cleanupEditMode();
        this.editingObj = this.createEmptyEditingObject();
        this.isDrawingNew = false;

        alert(
          this.editingObj.id
            ? "POI erfolgreich aktualisiert!"
            : "Neuer POI erfolgreich erstellt!"
        );
      } catch (error) {
        console.error("Error saving POI:", error);
        alert(`Fehler beim Speichern: ${error.message}`);
      } finally {
        this.isSaving = false;
      }
    },

    toggleEditingMode() {
      try {
        if (!this.changesHappened) {
          this.isEditingMode = !this.isEditingMode;
        } else {
          if (
            window.confirm(
              "Es gab änderungen wollen Sie den Editiermodus trotzdem verlassen ?"
            )
          ) {
            this.isEditingMode = true;
          }
        }
      } catch (e) {
        console.log(e);
      }
    },

    // --- Hilfsmethoden ---

    // Setzt den Bearbeitungsmodus zurück und leert MapboxDraw
    cleanupEditMode() {
      if (this.isEditingPosition) {
        console.log("Cleaning up position edit mode.");
        this.map.setFilter("poi-area-layer", null);
        this.map.setFilter("poi-area-outline", null);
        this.isEditingPosition = false;
      }
      this.isGeometryEditMode = false;
      this.isDrawingNew = false;
      this.cleanupDraw();
      this.map.doubleClickZoom.enable();
    },

    // Leert MapboxDraw und setzt zugehörige Zustände zurück
    cleanupDraw() {
      if (this.draw && this.draw.getAll().features.length > 0) {
        console.log("Deleting all features from Draw.");
        this.draw.deleteAll();
      }
      this.currentDrawFeatureId = null;
      this.draw?.changeMode("simple_select");
    },

    calculateArea(feature) {
      const coordinates = feature.geometry.coordinates[0];
      let area = 0;

      // Using the Shoelace formula (Gauss's area formula)
      for (let i = 0; i < coordinates.length - 1; i++) {
        const p1 = this.convertToMeters(coordinates[i]);
        const p2 = this.convertToMeters(coordinates[i + 1]);
        area += p1[0] * p2[1] - p2[0] * p1[1];
      }

      return Math.abs(area) / 2;
    },

    convertToMeters(coord) {
      // Convert longitude/latitude to approximate meters
      // Using equirectangular projection (rough approximation, good enough for small areas)
      const R = 6371000; // Earth's radius in meters
      const lat = (coord[1] * Math.PI) / 180;
      const lon = (coord[0] * Math.PI) / 180;
      const x = lon * R * Math.cos(lat);
      const y = lat * R;
      return [x, y];
    },

    showAreaOverlay(area) {
      // Remove existing overlay if any
      const existingOverlay = document.getElementById("area-overlay");
      if (existingOverlay) {
        existingOverlay.remove();
      }

      // Create new overlay
      const overlay = document.createElement("div");
      overlay.id = "area-overlay";
      overlay.style.position = "absolute";
      overlay.style.bottom = "60px";
      overlay.style.right = "10px";
      overlay.style.backgroundColor = "white";
      overlay.style.padding = "8px 12px";
      overlay.style.borderRadius = "4px";
      overlay.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
      overlay.style.zIndex = "1000";
      overlay.style.fontSize = "14px";
      overlay.innerHTML = `Fläche: ${area.toFixed(2)} m²`;

      this.map.getContainer().appendChild(overlay);
    },

    async exportMap() {
      if (!this.map || this.isExporting) return;

      try {
        this.isExporting = true;

        // Get the current view state
        const currentCenter = this.map.getCenter();
        const currentBearing = this.map.getBearing();
        const currentPitch = this.map.getPitch();

        // Store current dimensions
        const container = this.map.getContainer();
        const originalWidth = container.style.width;
        const originalHeight = container.style.height;

        // Calculate dimensions for DIN A2 (420x594mm) at 300 DPI
        // 1 inch = 25.4mm
        // At 300 DPI:
        // 420mm = (420 / 25.4) * 300 = 4960 pixels
        // 594mm = (594 / 25.4) * 300 = 7016 pixels
        const exportWidth = 4960; // 420mm at 300 DPI
        const exportHeight = 7016; // 594mm at 300 DPI

        // Set rectangular dimensions
        container.style.width = `${exportWidth}px`;
        container.style.height = `${exportHeight}px`;

        // Trigger resize and ensure the map renders completely
        this.map.resize();

        // Force exact zoom and center
        this.map.setZoom(18);
        this.map.setCenter(currentCenter);
        this.map.setBearing(currentBearing);
        this.map.setPitch(currentPitch);

        // Wait for the map to stabilize and render completely
        await new Promise((resolve) => {
          this.map.once("idle", () => {
            // Create a canvas and get the map canvas
            const canvas = document.createElement("canvas");
            const mapCanvas = this.map.getCanvas();
            canvas.width = exportWidth;
            canvas.height = exportHeight;

            // Draw the map onto our canvas
            const ctx = canvas.getContext("2d");

            // First fill with white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, exportWidth, exportHeight);

            // Then draw the map
            ctx.drawImage(mapCanvas, 0, 0, exportWidth, exportHeight);

            resolve(canvas);
          });
        });

        // Convert canvas to blob
        const blob = await new Promise((resolve) => {
          const canvas = document.createElement("canvas");
          const mapCanvas = this.map.getCanvas();
          canvas.width = exportWidth;
          canvas.height = exportHeight;

          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, exportWidth, exportHeight);
          ctx.drawImage(mapCanvas, 0, 0, exportWidth, exportHeight);

          canvas.toBlob(resolve, "image/png", 1.0);
        });

        // Create form data
        const formData = new FormData();
        formData.append("image", blob, "map-export.png");

        // Restore original dimensions
        container.style.width = originalWidth;
        container.style.height = originalHeight;
        this.map.resize();

        // Reset to original view
        this.map.setZoom(18);
        this.map.setCenter(currentCenter);
        this.map.setBearing(currentBearing);
        this.map.setPitch(currentPitch);

        // Send to backend
        const response = await fetch(
          `${import.meta.env.VITE_INTERNAL_API_URL}/export/poi-overview`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Export failed");
        }

        // Get the PDF blob
        const pdfBlob = await response.blob();

        // Create download link
        const downloadUrl = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "poi-overview.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (error) {
        console.error("Error exporting map:", error);
        alert("Fehler beim Exportieren der Karte");
      } finally {
        this.isExporting = false;
      }
    },
  },
};
</script>

<style>
.map-container {
  width: 100%;
  /* Höhe anpassen, z.B. volle Höhe abzüglich Header/Footer */
  height: 100vh; /* oder calc(100vh - XXpx) */
}

/* Stellt sicher, dass Maplibre Controls sichtbar sind */
.maplibregl-ctrl-group button .maplibregl-ctrl-icon {
  background-color: white; /* Standard-Hintergrund */
}

/* Beispiel für Styling des Speicherindikators */
.saving-indicator {
  /* Positionierung und Aussehen bereits in der Template Klasse definiert */
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

/* Styling für das Modal (Beispiel) */
.AppDialogPoi {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow-y: auto; /* Scrollbar, falls Inhalt zu lang */
  max-height: calc(100% - 1rem); /* Verhindert, dass es aus dem Bild ragt */
}
</style>
