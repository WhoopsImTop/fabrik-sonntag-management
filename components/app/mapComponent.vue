<template>
  <div class="relative h-full w-full">
    <AppDialogPoi
      v-if="isModalVisible"
      class="absolute top-2 left-2 bottom-2 z-10 w-80"
      :poiToEdit="editingObj"
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
    <button
      v-if="!isModalVisible"
      @click="handleCreateNew"
      class="absolute top-20 left-2 bg-white p-2 rounded shadow-md z-10"
    >
      Neuen POI erstellen
    </button>
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
      isModalVisible: false, // Steuert die Sichtbarkeit des Modals
      isEditingPosition: false, // Zeigt an, ob gerade die Position bearbeitet wird
      currentDrawFeatureId: null, // Speichert die ID des Features in MapboxDraw
      allPoisData: [], // Speichert alle geladenen POI-Daten
      editingObj: this.createEmptyEditingObject(), // Hält die Daten des aktuell bearbeiteten/neuen POIs
      // areaGeoJson wird nicht mehr global gebraucht, da Geometrie Teil von editingObj ist
    };
  },

  mounted() {
    this.map = new maplibregl.Map({
      container: "mapContainer",
      style: fabrikSonntagStyle,
      center: [7.968404, 48.098452],
      zoom: 16,
    });

    this.draw = new MaplibreDraw({
      displayControlsDefault: false, // Keine Standard-Controls
      controls: {
        // Nur Trash-Control anzeigen, wenn etwas im Draw ist
        trash: true,
      },
      // Optional: Styling für Draw anpassen
      styles: [
        // Style für Punkte im Bearbeitungsmodus
        {
          id: "gl-draw-point-active",
          type: "circle",
          filter: [
            "all",
            ["==", "$type", "Point"],
            ["==", "meta", "feature"],
            ["==", "active", "true"],
          ],
          paint: {
            "circle-radius": 7,
            "circle-color": "#fbb03b", // Aktive Farbe
          },
        },
        // Style für statische Punkte im Bearbeitungsmodus
        {
          id: "gl-draw-point-inactive",
          type: "circle",
          filter: [
            "all",
            ["==", "$type", "Point"],
            ["==", "meta", "feature"],
            ["==", "active", "false"],
          ],
          paint: {
            "circle-radius": 5,
            "circle-color": "#3bb2d0", // Inaktive Farbe
          },
        },
        // Füge hier ggf. Styles für Polygone etc. hinzu
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

      // Layer für die POI-Anzeige hinzufügen (z.B. als Kreise)
      this.map.addLayer({
        id: POI_LAYER_ID,
        type: "circle", // oder 'symbol' für Icons
        source: POI_SOURCE_ID,
        paint: {
          "circle-radius": 8,
          "circle-color": "#3887be", // Blau für Anzeige
          "circle-stroke-width": 1,
          "circle-stroke-color": "#ffffff",
        },
        // Wichtig: Layer interaktiv machen
        interactive: true,
      });

      // Klick-Listener für die Anzeige-Layer hinzufügen
      this.map.on("click", POI_LAYER_ID, this.handlePoiClick);
      // Cursor ändern, wenn über einem POI
      this.map.on("mouseenter", POI_LAYER_ID, () => {
        this.map.getCanvas().style.cursor = "pointer";
      });
      this.map.on("mouseleave", POI_LAYER_ID, () => {
        this.map.getCanvas().style.cursor = "";
      });

      // Draw Event Listener
      this.map.on("draw.update", this.handleDrawUpdate); // Wird ausgelöst, wenn Geometrie im Draw geändert wird
      this.map.on("draw.create", this.handleDrawCreate); // Wird ausgelöst, wenn Geometrie im Draw neu erstellt wird
      // this.map.on("draw.delete", this.handleDrawDelete); // Optional

      await this.loadAndDisplayPois(); // POIs laden und in der Anzeige-Layer darstellen
    });

    this.map.on("error", (e) => {
      console.error("MapLibre Error:", e);
    });
  },

  beforeUnmount() {
    if (this.map) {
      // Event Listener entfernen
      this.map.off("click", POI_LAYER_ID, this.handlePoiClick);
      this.map.off("mouseenter", POI_LAYER_ID);
      this.map.off("mouseleave", POI_LAYER_ID);
      this.map.off("draw.update", this.handleDrawUpdate);
      this.map.off("draw.create", this.handleDrawCreate);
      // this.map.off("draw.delete", this.handleDrawDelete);

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
        // Füge ggf. weitere Felder hinzu
      };
    },

    async loadAndDisplayPois() {
      try {
        const response = await fetch("http://localhost:3001/api/pois");
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        const apiData = await response.json();
        console.log("API Data received:", apiData);

        this.allPoisData = apiData; // Speichere die Rohdaten für später

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
          .filter((poi) => poi.areaGeoJson && poi.areaGeoJson.geometry) // Nur POIs mit Geometrie
          .map((poi) => {
            // Wichtig: Erstelle eine Kopie des Features, um das Original nicht zu ändern
            const feature = JSON.parse(JSON.stringify(poi.areaGeoJson));
            // Stelle sicher, dass die ID und andere notwendige Infos in den Properties sind
            feature.properties = {
              ...(feature.properties || {}), // Behalte existierende Properties
              poiId: poi.id, // Eindeutige ID des POIs
              name: poi.name, // Name für Tooltips o.ä.
              // Füge weitere Properties hinzu, falls benötigt
            };
            // Maplibre GL JS bevorzugt oft eine numerische ID im Feature selbst
            feature.id = poi.id;
            return feature;
          });

        const geoJsonData = {
          type: "FeatureCollection",
          features: features,
        };

        console.log("Updating POI display source:", geoJsonData);

        // Aktualisiere die Datenquelle der Anzeige-Layer
        if (this.map.getSource(POI_SOURCE_ID)) {
          this.map.getSource(POI_SOURCE_ID).setData(geoJsonData);
        } else {
          console.warn("POI Source not yet available during load");
          // Eventuell warten, bis Source sicher da ist oder erneut versuchen
        }

        // Stelle sicher, dass MapboxDraw leer ist
        this.draw.deleteAll();
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
          // Setze das editingObj mit den Daten des geklickten POIs
          this.editingObj = {
            id: poiData.id,
            address: poiData.address || "",
            areaGeoJson: poiData.areaGeoJson, // GeoJSON speichern
            directionDescription: poiData.directionDescription || "",
            iconId: poiData.iconId || null,
            name: poiData.name || "",
            poiType: poiData.poiType || "",
            shortName: poiData.shortName || "",
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
      this.cleanupEditMode(); // Bearbeitungsmodus beenden und Draw leeren
      this.editingObj = this.createEmptyEditingObject(); // Reset
    },

    // Wird vom Modal aufgerufen, wenn "Position bearbeiten" geklickt wird
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

      console.log(`Starting position edit for POI ID: ${this.editingObj.id}`);
      this.isEditingPosition = true;

      // 1. Feature aus der Anzeige-Layer "entfernen" (wir filtern es aus)
      this.map.setFilter(POI_LAYER_ID, [
        "!=",
        ["get", "poiId"],
        this.editingObj.id,
      ]);

      // 2. Feature zu MapboxDraw hinzufügen
      const featureToAdd = JSON.parse(
        JSON.stringify(this.editingObj.areaGeoJson)
      );
      // Stelle sicher, dass Draw die POI-ID kennt, falls sie nicht im Feature.id ist
      featureToAdd.properties = {
        ...(featureToAdd.properties || {}),
        poiId: this.editingObj.id,
      };
      // MapboxDraw braucht eine eigene ID, wir speichern sie
      const addedFeatures = this.draw.add(featureToAdd);
      if (addedFeatures && addedFeatures.length > 0) {
        this.currentDrawFeatureId = addedFeatures[0]; // Die von Draw vergebene ID speichern

        // 3. In den Bearbeitungsmodus wechseln (Punkt direkt auswählbar machen)
        this.draw.changeMode("direct_select", {
          featureId: this.currentDrawFeatureId,
        });
        console.log(
          `Feature ${this.currentDrawFeatureId} added to Draw and selected.`
        );
      } else {
        console.error("Failed to add feature to Mapbox Draw");
        this.cleanupEditMode(); // Rollback
      }
    },

    // Wird aufgerufen, wenn die Geometrie im Draw *verändert* wurde
    async handleDrawUpdate(e) {
      if (!this.isEditingPosition || !e.features || e.features.length === 0) {
        // Nur speichern, wenn wir explizit im Positions-Bearbeitungsmodus sind
        return;
      }

      const updatedFeature = e.features[0];
      // Stelle sicher, dass es das Feature ist, das wir bearbeiten
      if (updatedFeature.id !== this.currentDrawFeatureId) {
        console.warn(
          "Draw update event for unexpected feature:",
          updatedFeature.id
        );
        return;
      }

      const poiId = updatedFeature.properties.poiId || this.editingObj.id; // Hole POI ID

      if (!poiId) {
        console.error(
          "Cannot update feature: Missing 'poiId' in feature properties or editingObj.",
          updatedFeature
        );
        alert(
          "Fehler: Konnte das Objekt nicht eindeutig identifizieren. Änderung nicht gespeichert."
        );
        return;
      }

      console.log(
        `Feature ${this.currentDrawFeatureId} (POI ID: ${poiId}) updated in Draw.`
      );
      this.isSaving = true;

      // Aktualisiere die Geometrie im `editingObj` sofort
      this.editingObj.areaGeoJson = {
        type: "Feature",
        properties: updatedFeature.properties, // Behalte Properties bei
        geometry: updatedFeature.geometry,
      };

      // Sende nur die Geometrie-Änderung per PATCH
      const patchData = {
        areaGeoJson: this.editingObj.areaGeoJson,
      };

      console.log(
        `Sending PATCH to /api/pois/${poiId} with geometry data:`,
        patchData
      );

      try {
        const response = await fetch(
          `http://localhost:3001/api/pois/${poiId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patchData),
          }
        );

        if (!response.ok) {
          // Fehlerbehandlung wie im Originalcode
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
        console.log("API PATCH (geometry) successful:", result);
        // Optional: Kurze Bestätigung anzeigen, aber Modal bleibt offen
        // alert("Position erfolgreich gespeichert!");
      } catch (error) {
        console.error("Error sending PATCH request for geometry:", error);
        alert(`Fehler beim Speichern der Positionsänderung: ${error.message}`);
        // Hier könntest du überlegen, die Bearbeitung abzubrechen oder die alte Position wiederherzustellen
      } finally {
        this.isSaving = false;
      }
    },

    // Wird aufgerufen, wenn eine *neue* Geometrie im Draw *erstellt* wurde
    handleDrawCreate(e) {
      if (!this.isModalVisible || this.editingObj.id !== null) {
        // Dies sollte nur passieren, wenn wir einen *neuen* POI erstellen
        console.warn("draw.create triggered unexpectedly.");
        // Lösche das gezeichnete Feature wieder, da es nicht Teil des Workflows ist
        if (e.features && e.features.length > 0) {
          this.draw.delete(e.features.map((f) => f.id));
        }
        return;
      }

      const newFeature = e.features[0];
      console.log("New geometry created:", newFeature);

      // Speichere die neue Geometrie im editingObj für den neuen POI
      this.editingObj.areaGeoJson = {
        type: "Feature",
        properties: {}, // Initial leere Properties
        geometry: newFeature.geometry,
      };

      // Wechsle zurück in den einfachen Auswahlmodus, um versehentliches Weiterzeichnen zu verhindern
      this.draw.changeMode("simple_select");
      // Optional: Lösche das Feature aus Draw, da die Geometrie nun im `editingObj` ist
      // this.draw.delete(newFeature.id); // Oder behalte es für visuelles Feedback?
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

      // Vorherige Zeichnungen in Draw löschen (sollte leer sein, aber sicher ist sicher)
      this.draw.deleteAll();
      this.editingObj.areaGeoJson = null; // Geometrie zurücksetzen

      if (mode === "point") {
        console.log("Starting to draw a point for new POI...");
        this.draw.changeMode("draw_point");
      } else if (mode === "polygon") {
        console.log("Starting to draw a polygon for new POI...");
        this.draw.changeMode("draw_polygon");
      }
      // Füge ggf. 'line_string' etc. hinzu
      else {
        console.warn("Unknown drawing mode:", mode);
      }
    },

    // Speichert die Daten aus dem Modal (Metadaten und ggf. neue Geometrie)
    async handleSave(poiDataFromModal) {
      console.log("Save triggered from modal with data:", poiDataFromModal);
      this.isSaving = true;

      // Kombiniere Modal-Daten mit der Geometrie aus editingObj
      // Überschreibe Felder aus poiDataFromModal in unserem editingObj
      const dataToSend = {
        ...this.editingObj, // Enthält ID (wenn vorhanden) und areaGeoJson
        ...poiDataFromModal, // Überschreibt Name, Adresse etc. mit Werten aus dem Modal
      };
      // Entferne die ID aus den zu sendenden Daten, wenn es ein neuer POI ist
      if (dataToSend.id === null) {
        delete dataToSend.id;
      }

      // Prüfe, ob eine Geometrie vorhanden ist (wichtig für neue POIs)
      if (!dataToSend.areaGeoJson || !dataToSend.areaGeoJson.geometry) {
        alert("Bitte legen Sie zuerst eine Position auf der Karte fest.");
        this.isSaving = false;
        return;
      }

      try {
        let response;
        let url;

        if (this.editingObj.id !== null) {
          // --- UPDATE (PATCH) ---
          url = `http://localhost:3001/api/pois/${this.editingObj.id}`;
          console.log(`Sending PATCH to ${url} with data:`, dataToSend);
          response = await fetch(url, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            // Sende nur die geänderten Metadaten UND die (potentiell auch geänderte) Geometrie
            body: JSON.stringify(dataToSend),
          });
        } else {
          // --- CREATE (POST) ---
          url = "http://localhost:3001/api/pois";
          console.log(`Sending POST to ${url} with data:`, dataToSend);
          response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dataToSend),
          });
        }

        if (!response.ok) {
          // Fehlerbehandlung wie im Original
          let errorBody = null;
          try {
            errorBody = await response.json();
          } catch (e) {}
          console.error(
            `API ${this.editingObj.id ? "PATCH" : "POST"} request failed:`,
            response.status,
            errorBody
          );
          throw new Error(
            `API request failed with status ${response.status}. ${
              errorBody?.message || ""
            }`
          );
        }

        const result = await response.json();
        console.log(
          `API ${this.editingObj.id ? "PATCH" : "POST"} successful:`,
          result
        );
        alert(
          `POI erfolgreich ${this.editingObj.id ? "aktualisiert" : "erstellt"}!`
        );

        // Nach erfolgreichem Speichern:
        this.isModalVisible = false;
        this.cleanupEditMode(); // Stellt sicher, dass Draw sauber ist und Filter zurückgesetzt wird
        await this.loadAndDisplayPois(); // Daten neu laden und anzeigen
        this.editingObj = this.createEmptyEditingObject(); // Reset für nächsten Einsatz
      } catch (error) {
        console.error(
          `Error sending ${this.editingObj.id ? "PATCH" : "POST"} request:`,
          error
        );
        alert(`Fehler beim Speichern des POIs: ${error.message}`);
      } finally {
        this.isSaving = false;
      }
    },

    // --- Hilfsmethoden ---

    // Setzt den Bearbeitungsmodus zurück und leert MapboxDraw
    cleanupEditMode() {
      if (this.isEditingPosition) {
        console.log("Cleaning up position edit mode.");
        // Filter zurücksetzen, damit alle POIs wieder angezeigt werden
        this.map.setFilter(POI_LAYER_ID, null);
        this.isEditingPosition = false;
      }
      this.cleanupDraw();
    },

    // Leert MapboxDraw und setzt zugehörige Zustände zurück
    cleanupDraw() {
      if (this.draw && this.draw.getAll().features.length > 0) {
        console.log("Deleting all features from Draw.");
        this.draw.deleteAll();
      }
      this.currentDrawFeatureId = null;
      // Ggf. Modus zurücksetzen
      this.draw.changeMode("simple_select");
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
