<template>
  <section class="flex flex-col gap-6">
    <UiModal
      :open="selectedImage"
      title="Bild löschen"
      description="Möchtest du das ausgewählte Bild wirklich löschen?"
      @update:open="(v) => { if (!v) selectedImage = null }"
    >
      <template #footer>
        <button type="button" class="btn-dialog-cancel" @click="selectedImage = null">
          Abbrechen
        </button>
        <button type="button" class="btn-dialog-danger" @click="deleteImage">
          Bild löschen
        </button>
      </template>
    </UiModal>

    <UiModal
      :open="!!labelEditDevice"
      @update:open="(v) => { if (!v) labelEditDevice = null }"
    >
      <template #content>
        <div class="dialog-panel max-w-md pointer-events-auto">
          <div class="dialog-header">
            <h3 class="dialog-title">Geräte-Bezeichnung</h3>
            <button
              type="button"
              class="dialog-close"
              aria-label="Schließen"
              @click="labelEditDevice = null"
            >
              <UiIcon name="i-lucide-x" class="size-5" />
            </button>
          </div>
          <form @submit.prevent="saveDeviceLabel">
            <div class="dialog-body space-y-4">
              <p class="dialog-desc !mt-0 font-mono text-xs">
                {{ labelEditDevice?.device_id }}
              </p>
              <div>
                <label class="dialog-label">Bezeichnung</label>
                <input
                  v-model="labelEditValue"
                  placeholder="z.B. Keller EG"
                  class="dialog-input"
                  autofocus
                />
              </div>
            </div>
            <div class="dialog-footer">
              <button type="button" class="btn-dialog-cancel" @click="labelEditDevice = null">
                Abbrechen
              </button>
              <button type="submit" class="btn-dialog-primary">Speichern</button>
            </div>
          </form>
        </div>
      </template>
    </UiModal>

    <div class="flex flex-wrap items-end gap-4">
      <div class="flex flex-col gap-1 min-w-48">
        <label class="text-sm font-medium text-neutral-900">Gerät</label>
        <select
          v-model="filters.deviceId"
          class="rounded-none border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        >
          <option value="">Alle Geräte</option>
          <option value="__unknown__">Ohne Gerät</option>
          <option
            v-for="device in cameraDevices"
            :key="device.device_id"
            :value="device.device_id"
          >
            {{ device.label || device.device_id }}
          </option>
        </select>
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-neutral-900">Von</label>
        <input
          v-model="filters.dateFrom"
          type="date"
          class="rounded-none border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
      </div>
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-neutral-900">Bis</label>
        <input
          v-model="filters.dateTo"
          type="date"
          class="rounded-none border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        />
      </div>
      <div class="flex gap-2">
        <UiButton
          color="primary"
          variant="solid"
          icon="i-lucide-filter"
          :loading="loading"
          @click="loadImages()"
        >
          Filtern
        </UiButton>
        <button
          v-if="filters.deviceId || filters.dateFrom || filters.dateTo"
          type="button"
          class="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900"
          @click="resetFilters"
        >
          Zurücksetzen
        </button>
      </div>
    </div>

    <div v-if="loading && !imageDates" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center justify-center text-sm text-neutral-500">
        lade daten...
      </div>
    </div>
    <div v-else-if="imageDates && Object.keys(imageDates).length === 0" class="flex items-center justify-center py-12">
      <div class="text-sm text-neutral-500">Keine Bilder für die gewählten Filter gefunden.</div>
    </div>
    <div v-else-if="imageDates">
      <div
        v-for="(date, i) in Object.keys(imageDates)"
        :key="i"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-4">
          <span class="text-sm font-extrabold">{{
            new Date(date).toLocaleDateString("DE-de", {
              day: "2-digit",
              month: "long",
              year: "2-digit",
            })
          }}</span>
        </div>
        <div class="flex gap-4 items-center overflow-x-scroll flex-nowrap">
          <div
            class="aspect-video min-w-72 w-72 flex items-center justify-center overflow-hidden relative group bg-neutral-100"
            v-for="image in imageDates[date]"
            :key="image.name"
          >
            <button
              class="bg-white border-none outline-none w-8 h-8 rounded-none absolute top-2 right-2 z-20 items-center justify-center hidden group-hover:flex"
              @click="selectedImage = image"
            >
              <IconTrash class="size-4" />
            </button>
            <img
              :src="imagesUrl + image.url"
              :alt="image.name"
              class="h-full w-full object-cover"
            />
            <div
              class="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-white"
            >
              <button
                v-if="image.device_id"
                type="button"
                class="inline-block mt-0.5 max-w-full truncate text-xs px-1.5 py-0.5 bg-white/10 border border-white text-left hover:bg-white/20 transition-colors"
                @click="openLabelEdit(image)"
              >
                {{ image.device_label || "Bezeichnung setzen" }}
              </button>
              <p class="mt-1.5 text-xs text-white/80">
                {{ formatImageTime(image.timestamp) }} Uhr
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axios from "axios";
export default {
  data: () => {
    return {
      imageDates: null,
      imagesUrl: import.meta.env.VITE_INTERNAL_IMAGE_URL,
      toast: useToast(),
      selectedImage: null,
      labelEditDevice: null,
      labelEditValue: "",
      loading: false,
      cameraDevices: [],
      filters: {
        deviceId: "",
        dateFrom: "",
        dateTo: "",
      },
    };
  },
  methods: {
    openLabelEdit(image) {
      this.labelEditDevice = {
        device_id: image.device_id,
        device_label: image.device_label,
      };
      this.labelEditValue = image.device_label || "";
    },
    async saveDeviceLabel() {
      if (!this.labelEditDevice) return;
      try {
        await axios.put(
          import.meta.env.VITE_INTERNAL_API_URL +
            "/images/devices/" +
            encodeURIComponent(this.labelEditDevice.device_id),
          { label: this.labelEditValue },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("jwt")}`,
            },
          }
        );
        const label = this.labelEditValue.trim() || null;
        for (const date in this.imageDates) {
          this.imageDates[date] = this.imageDates[date].map((img) =>
            img.device_id === this.labelEditDevice.device_id
              ? { ...img, device_label: label }
              : img
          );
        }
        const existing = this.cameraDevices.find(
          (d) => d.device_id === this.labelEditDevice.device_id
        );
        if (existing) {
          existing.label = label;
        } else {
          this.cameraDevices.push({
            device_id: this.labelEditDevice.device_id,
            label,
          });
        }
        this.labelEditDevice = null;
        this.toast.add({
          title: "Bezeichnung gespeichert",
          icon: "i-lucide-check",
          color: "primary",
        });
      } catch {
        this.toast.add({
          title: "Fehler beim Speichern",
          description: "Die Bezeichnung konnte nicht gespeichert werden.",
          icon: "i-lucide-server-off",
          color: "error",
        });
      }
    },
    formatImageTime(timestamp) {
      if (!timestamp) return "—";
      return new Date(timestamp).toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit"
      });
    },
    buildQueryParams() {
      const params = new URLSearchParams();
      if (this.filters.deviceId) {
        params.set("device_id", this.filters.deviceId);
      }
      if (this.filters.dateFrom) {
        params.set("from", this.filters.dateFrom);
      }
      if (this.filters.dateTo) {
        params.set("to", this.filters.dateTo);
      }
      return params.toString();
    },
    sortImageDates(data) {
      return Object.entries(data)
        .sort(([datumA], [datumB]) => {
          return new Date(datumB) - new Date(datumA);
        })
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    },
    async loadCameraDevices() {
      try {
        const meterApi = useMeterApi();
        this.cameraDevices = await meterApi.getCameraDevices();
      } catch {
        this.cameraDevices = [];
      }
    },
    async loadImages({ showToast = false } = {}) {
      this.loading = true;
      const query = this.buildQueryParams();
      const url =
        import.meta.env.VITE_INTERNAL_API_URL +
        "/images" +
        (query ? `?${query}` : "");
      try {
        const res = await axios.get(url);
        this.imageDates = this.sortImageDates(res.data);
        if (showToast) {
          this.toast.add({
            title: "Bilder abgerufen",
            description: "Die Zählerbilder wurden erfolgreich abgerufen",
            icon: "i-lucide-image",
            color: "primary",
          });
        }
      } catch {
        this.imageDates = {};
        this.toast.add({
          title: "Fehler beim Laden...",
          description: "Es gab einen Fehler. Bitte versuche es später erneut.",
          icon: "i-lucide-server-off",
          color: "error",
        });
      } finally {
        this.loading = false;
      }
    },
    resetFilters() {
      this.filters = {
        deviceId: "",
        dateFrom: "",
        dateTo: "",
      };
      this.loadImages();
    },
    deleteImage() {
      const name = this.selectedImage.name;
      axios
        .delete(import.meta.env.VITE_INTERNAL_API_URL + "/images/" + name, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("jwt")}`,
          },
        })
        .then((res) => {
          console.log(res.data);

          for (const date in this.imageDates) {
            if (this.imageDates[date]) {
              this.imageDates[date] = this.imageDates[date].filter(
                (image) => image.name !== name
              );

              if (this.imageDates[date].length === 0) {
                delete this.imageDates[date];
              }
            }
          }

          this.selectedImage = null;
          this.toast.add({
            title: "Bild gelöscht",
            description: "Das gewählte Bild wurde erfolgreich gelöscht.",
            icon: "i-lucide-trash-2",
            color: "primary",
          });
        })
        .catch((e) => {
          this.toast.add({
            title: "Fehler beim Löschen...",
            description:
              "Es gab einen Fehler. Bitte versuche es später erneut.",
            icon: "i-lucide-server-off",
            color: "error",
          });
        });
    },
  },
  async mounted() {
    await this.loadCameraDevices();
    await this.loadImages({ showToast: true });
  },
};
</script>

<style></style>
