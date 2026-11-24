<template>
  <section class="flex flex-col gap-6">
    <UiModal
      class="z-50"
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

    <!-- OCR / Ollama -->
    <div class="flex flex-col gap-3 border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex min-w-0 flex-col gap-1">
        <div class="flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-900">
          <UiIcon name="i-lucide-scan-text" class="size-4" />
          Zähler-OCR
          <span class="font-mono text-xs text-neutral-500">{{ ocrStatus?.model || "—" }}</span>
          <span
            v-if="ocrStatus"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px]"
            :class="ocrHealthClass"
          >
            <span class="size-1.5 rounded-full bg-current" />
            {{ ocrHealthLabel }}
          </span>
        </div>
        <p v-if="ocrStatus?.ollamaError" class="text-xs text-red-600">
          {{ ocrStatus.ollamaError }}
        </p>
        <p v-if="ocrStatus" class="text-xs text-neutral-500">
          {{ ocrStatus.counts.queued }} in Queue
          · {{ ocrStatus.counts.processing }} in Bearbeitung
          · {{ ocrStatus.counts.done }} erkannt
          · {{ ocrStatus.counts.failed }} fehlgeschlagen
          · {{ ocrStatus.counts.pending }} offen
        </p>
      </div>
      <div class="flex shrink-0 flex-wrap items-center gap-2">
        <button
          v-if="selectedNames.length"
          type="button"
          class="btn-dialog-primary gap-2"
          :disabled="queueBusy"
          @click="queueImages(selectedNames)"
        >
          <UiIcon name="i-lucide-list-plus" class="size-4" />
          {{ selectedNames.length }} zur Queue
        </button>
        <button
          type="button"
          class="btn-dialog-cancel gap-2"
          :disabled="queueBusy || !ocrStatus?.counts.pending"
          @click="queueAllPending"
        >
          <UiIcon name="i-lucide-list-plus" class="size-4" />
          Alle offenen zur Queue
        </button>
        <button
          v-if="ocrStatus?.counts.queued"
          type="button"
          class="btn-dialog-cancel gap-2"
          :disabled="queueBusy"
          @click="clearQueue"
        >
          <UiIcon name="i-lucide-list-x" class="size-4" />
          Queue leeren
        </button>
      </div>
    </div>

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
        <label class="text-sm font-medium text-neutral-900">OCR-Status</label>
        <select
          v-model="filters.ocrStatus"
          class="rounded-none border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-400"
        >
          <option value="">Alle</option>
          <option v-for="(label, key) in ocrStatusLabels" :key="key" :value="key">
            {{ label }}
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
          v-if="filters.deviceId || filters.dateFrom || filters.dateTo || filters.ocrStatus"
          type="button"
          class="px-3 py-2 text-sm text-neutral-500 hover:text-neutral-900"
          @click="resetFilters"
        >
          Zurücksetzen
        </button>
      </div>
    </div>

    <div v-if="loading && !images.length" class="flex items-center justify-center py-12">
      <div class="flex flex-col items-center justify-center text-sm text-neutral-500">
        lade daten...
      </div>
    </div>
    <div v-else-if="!loading && images.length === 0" class="flex items-center justify-center py-12">
      <div class="text-sm text-neutral-500">Keine Bilder für die gewählten Filter gefunden.</div>
    </div>
    <div v-else class="flex flex-col gap-6">
      <div
        v-for="group in groupedImages"
        :key="group.date"
        class="flex flex-col gap-2"
      >
        <div class="flex items-center gap-4">
          <span class="text-sm font-extrabold">{{
            new Date(group.date).toLocaleDateString("DE-de", {
              day: "2-digit",
              month: "long",
              year: "2-digit",
            })
          }}</span>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div
            v-for="image in group.images"
            :key="image.name"
            class="flex flex-col border bg-white"
            :class="selectedNames.includes(image.name) ? 'border-brand-accent ring-2 ring-brand-accent' : 'border-neutral-200'"
          >
            <div class="group relative aspect-video overflow-hidden bg-neutral-100">
              <a :href="imagesUrl + image.url" target="_blank" rel="noopener" title="Original öffnen">
                <img
                  :src="thumbnailUrl(image)"
                  :alt="image.name"
                  class="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  width="320"
                  height="180"
                />
              </a>
              <label
                class="absolute left-2 top-2 z-20 flex size-6 cursor-pointer items-center justify-center border border-neutral-300 bg-white/95"
                title="Für Queue auswählen"
              >
                <input
                  type="checkbox"
                  class="size-3.5"
                  :checked="selectedNames.includes(image.name)"
                  @change="toggleSelection(image.name)"
                />
              </label>
              <button
                class="bg-white border-none outline-none w-8 h-8 rounded-none absolute top-2 right-2 z-20 items-center justify-center hidden group-hover:flex"
                title="Löschen"
                @click="selectedImage = image"
              >
                <UiIcon name="i-lucide-trash" class="size-4" />
              </button>
              <div
                class="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2.5 pt-8 text-white"
              >
                <button
                  v-if="image.device_id"
                  type="button"
                  class="pointer-events-auto inline-block mt-0.5 max-w-full truncate text-xs px-1.5 py-0.5 bg-white/10 border border-white text-left hover:bg-white/20 transition-colors"
                  @click="openLabelEdit(image)"
                >
                  {{ image.device_label || "Bezeichnung setzen" }}
                </button>
                <p class="mt-1.5 text-xs text-white/80">
                  {{ formatImageTime(image.timestamp) }} Uhr
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between gap-2 px-3 py-2">
              <div class="min-w-0">
                <p
                  v-if="image.number !== null"
                  class="font-mono text-sm font-semibold text-neutral-900"
                  :title="image.ocr_raw ? `Modell-Antwort: ${image.ocr_raw}` : ''"
                >
                  {{ formatReading(image) }}
                  <span v-if="image.unit" class="font-sans text-xs font-normal text-neutral-500">
                    {{ image.unit }}
                  </span>
                </p>
                <p
                  class="truncate text-[11px]"
                  :class="ocrStatusClass(image.ocr_status)"
                  :title="[image.ocr_error, image.ocr_raw && `Modell-Antwort: ${image.ocr_raw}`, image.ocr_model].filter(Boolean).join('\n')"
                >
                  {{ ocrStatusLabels[image.ocr_status] || image.ocr_status }}
                  <template v-if="image.ocr_status === 'failed' && image.ocr_error">
                    – {{ image.ocr_error }}
                  </template>
                </p>
              </div>
              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  class="flex size-8 items-center justify-center border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                  title="Jetzt analysieren"
                  :disabled="isBusy(image)"
                  @click="analyzeImage(image)"
                >
                  <UiIcon
                    :name="analyzing[image.name] || image.ocr_status === 'processing' ? 'i-lucide-loader-2' : 'i-lucide-scan-text'"
                    class="size-4"
                    :class="{ 'animate-spin': analyzing[image.name] || image.ocr_status === 'processing' }"
                  />
                </button>
                <button
                  type="button"
                  class="flex size-8 items-center justify-center border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                  title="Zur Queue hinzufügen"
                  :disabled="isBusy(image) || image.ocr_status === 'queued'"
                  @click="queueImages([image.name])"
                >
                  <UiIcon name="i-lucide-list-plus" class="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        :ref="setSentinel"
        class="flex items-center justify-center gap-3 py-4 text-xs text-neutral-500"
      >
        <template v-if="loadingMore">
          <UiIcon name="i-lucide-loader-2" class="size-4 animate-spin" />
          Weitere Bilder werden geladen…
        </template>
        <button
          v-else-if="hasMore"
          type="button"
          class="btn-dialog-cancel"
          @click="loadMore"
        >
          Mehr laden
        </button>
        <span v-if="total">{{ images.length }} von {{ total }} Bildern</span>
      </div>
    </div>
  </section>
</template>

<script>
import axios from "axios";

const PAGE_SIZE = 24;
const POLL_MS = 4000;

export default {
  data: () => {
    return {
      images: [],
      page: 0,
      totalPages: 1,
      total: 0,
      imagesUrl: import.meta.env.VITE_INTERNAL_IMAGE_URL,
      apiUrl: import.meta.env.VITE_INTERNAL_API_URL,
      toast: useToast(),
      selectedImage: null,
      labelEditDevice: null,
      labelEditValue: "",
      loading: false,
      loadingMore: false,
      requestSeq: 0,
      cameraDevices: [],
      selectedNames: [],
      analyzing: {},
      queueBusy: false,
      ocrStatus: null,
      pollTimer: null,
      observer: null,
      sentinelEl: null,
      ocrStatusLabels: {
        pending: "Nicht analysiert",
        queued: "In Queue",
        processing: "Wird analysiert…",
        done: "Erkannt",
        failed: "Fehlgeschlagen",
      },
      filters: {
        deviceId: "",
        ocrStatus: "",
        dateFrom: "",
        dateTo: "",
      },
    };
  },
  computed: {
    hasMore() {
      return this.page < this.totalPages;
    },
    groupedImages() {
      const groups = [];
      const byDate = {};
      for (const image of this.images) {
        if (!byDate[image.date]) {
          byDate[image.date] = { date: image.date, images: [] };
          groups.push(byDate[image.date]);
        }
        byDate[image.date].images.push(image);
      }
      return groups;
    },
    ocrHealthLabel() {
      if (!this.ocrStatus?.reachable) return "Ollama nicht erreichbar";
      if (!this.ocrStatus.modelAvailable) return "Modell nicht installiert";
      return this.ocrStatus.running ? "Läuft" : "Bereit";
    },
    ocrHealthClass() {
      if (!this.ocrStatus?.reachable || !this.ocrStatus.modelAvailable) {
        return "bg-red-50 text-red-700";
      }
      return "bg-green-50 text-green-700";
    },
  },
  methods: {
    authHeaders() {
      return { Authorization: `Bearer ${localStorage.getItem("jwt")}` };
    },
    thumbnailUrl(image) {
      return `${this.apiUrl}/images/${encodeURIComponent(image.name)}/thumbnail`;
    },
    // Stand wie am Zähler (führende Nullen, Trennzeichen nur wenn sichtbar).
    // Kein toLocaleString: daraus wurde aus 7070 sonst "7.070".
    formatReading(item) {
      if (item?.reading) return item.reading;
      const num = Number(item?.number);
      // Ältere Einträge ohne reading: DECIMAL(14,3) liefert "7070.000"
      return Number.isFinite(num) ? String(num) : item?.number;
    },
    ocrStatusClass(status) {
      return {
        done: "text-green-700",
        failed: "text-red-600",
        queued: "text-amber-600",
        processing: "text-amber-600",
      }[status] || "text-neutral-500";
    },
    isBusy(image) {
      return !!this.analyzing[image.name] || image.ocr_status === "processing";
    },
    toggleSelection(name) {
      const idx = this.selectedNames.indexOf(name);
      if (idx === -1) this.selectedNames.push(name);
      else this.selectedNames.splice(idx, 1);
    },
    applyOcrResult(name, result) {
      const image = this.images.find((img) => img.name === name);
      if (image && result) Object.assign(image, result);
    },
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
          { headers: this.authHeaders() }
        );
        const label = this.labelEditValue.trim() || null;
        for (const image of this.images) {
          if (image.device_id === this.labelEditDevice.device_id) {
            image.device_label = label;
          }
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
    buildQueryParams(page) {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (this.filters.deviceId) {
        params.set("device_id", this.filters.deviceId);
      }
      if (this.filters.ocrStatus) {
        params.set("ocr_status", this.filters.ocrStatus);
      }
      if (this.filters.dateFrom) {
        params.set("from", this.filters.dateFrom);
      }
      if (this.filters.dateTo) {
        params.set("to", this.filters.dateTo);
      }
      return params.toString();
    },
    async loadCameraDevices() {
      try {
        const meterApi = useMeterApi();
        this.cameraDevices = await meterApi.getCameraDevices();
      } catch {
        this.cameraDevices = [];
      }
    },
    async fetchPage(page) {
      const res = await axios.get(
        `${this.apiUrl}/images?${this.buildQueryParams(page)}`
      );
      return res.data;
    },
    // Lädt ab Seite 1 neu (Filter, Mount)
    async loadImages() {
      const seq = ++this.requestSeq;
      this.loading = true;
      try {
        const data = await this.fetchPage(1);
        if (seq !== this.requestSeq) return;
        this.images = data.items;
        this.page = data.page;
        this.total = data.total;
        this.totalPages = data.totalPages;
        this.selectedNames = [];
      } catch {
        if (seq !== this.requestSeq) return;
        this.images = [];
        this.toast.add({
          title: "Fehler beim Laden...",
          description: "Es gab einen Fehler. Bitte versuche es später erneut.",
          icon: "i-lucide-server-off",
          color: "error",
        });
      } finally {
        if (seq === this.requestSeq) this.loading = false;
      }
    },
    async loadMore() {
      if (this.loading || this.loadingMore || !this.hasMore) return;
      const seq = this.requestSeq;
      this.loadingMore = true;
      try {
        const data = await this.fetchPage(this.page + 1);
        if (seq !== this.requestSeq) return;
        const known = new Set(this.images.map((img) => img.name));
        this.images.push(...data.items.filter((img) => !known.has(img.name)));
        this.page = data.page;
        this.total = data.total;
        this.totalPages = data.totalPages;
      } catch {
        this.toast.add({ title: "Fehler beim Nachladen", color: "error" });
        return;
      } finally {
        this.loadingMore = false;
      }
      // Sentinel noch sichtbar (große Bildschirme) → direkt weiterladen
      await this.$nextTick();
      const el = this.sentinelEl;
      if (el && this.hasMore && el.getBoundingClientRect().top < window.innerHeight + 400) {
        this.loadMore();
      }
    },
    resetFilters() {
      this.filters = {
        deviceId: "",
        ocrStatus: "",
        dateFrom: "",
        dateTo: "",
      };
      this.loadImages();
    },
    async analyzeImage(image) {
      this.analyzing = { ...this.analyzing, [image.name]: true };
      image.ocr_status = "processing";
      try {
        const res = await axios.post(
          `${this.apiUrl}/images/ocr/analyze`,
          { fileName: image.name },
          { headers: this.authHeaders() }
        );
        this.applyOcrResult(image.name, res.data);
        this.toast.add(
          res.data.ocr_status === "done"
            ? {
                title: "Zählerstand erkannt",
                description: [this.formatReading(res.data), res.data.unit].filter(Boolean).join(" "),
                icon: "i-lucide-scan-text",
                color: "primary",
              }
            : {
                title: "Kein Zählerstand erkannt",
                description: res.data.ocr_error || undefined,
                icon: "i-lucide-scan-text",
                color: "error",
              }
        );
      } catch (e) {
        image.ocr_status = "failed";
        this.toast.add({
          title: "Analyse fehlgeschlagen",
          description: e?.response?.data?.error || "Bitte später erneut versuchen.",
          icon: "i-lucide-server-off",
          color: "error",
        });
      } finally {
        const { [image.name]: _, ...rest } = this.analyzing;
        this.analyzing = rest;
        this.loadOcrStatus();
      }
    },
    async queueRequest(method, body) {
      this.queueBusy = true;
      try {
        const res = await axios({
          method,
          url: `${this.apiUrl}/images/ocr/queue`,
          data: body,
          headers: this.authHeaders(),
        });
        this.ocrStatus = res.data.status;
        this.ensurePolling();
        return res.data;
      } catch {
        this.toast.add({
          title: "Queue-Aktion fehlgeschlagen",
          icon: "i-lucide-server-off",
          color: "error",
        });
        return null;
      } finally {
        this.queueBusy = false;
      }
    },
    async queueImages(names) {
      const data = await this.queueRequest("post", { fileNames: names });
      if (!data) return;
      for (const name of names) {
        const image = this.images.find((img) => img.name === name);
        if (image && image.ocr_status !== "processing") image.ocr_status = "queued";
      }
      this.selectedNames = this.selectedNames.filter((n) => !names.includes(n));
      this.toast.add({
        title: data.queued === 1 ? "1 Bild in der Queue" : `${data.queued} Bilder in der Queue`,
        icon: "i-lucide-list-plus",
        color: "primary",
      });
    },
    async queueAllPending() {
      const data = await this.queueRequest("post", { all_pending: true });
      if (!data) return;
      for (const image of this.images) {
        if (image.ocr_status === "pending" && image.id) image.ocr_status = "queued";
      }
      this.toast.add({
        title: `${data.queued} Bilder in der Queue`,
        icon: "i-lucide-list-plus",
        color: "primary",
      });
    },
    async clearQueue() {
      const data = await this.queueRequest("delete");
      if (!data) return;
      for (const image of this.images) {
        if (image.ocr_status === "queued") image.ocr_status = "pending";
      }
    },
    async loadOcrStatus() {
      try {
        const res = await axios.get(`${this.apiUrl}/images/ocr/status`, {
          headers: this.authHeaders(),
        });
        this.ocrStatus = res.data;
      } catch {
        this.ocrStatus = null;
      }
      this.ensurePolling();
    },
    // Solange die Queue läuft: Status + sichtbare Ergebnisse aktualisieren
    ensurePolling() {
      const active =
        this.ocrStatus &&
        (this.ocrStatus.counts.queued > 0 || this.ocrStatus.counts.processing > 0);
      if (active && !this.pollTimer) {
        this.pollTimer = setInterval(this.pollOcr, POLL_MS);
      } else if (!active && this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
        this.refreshVisibleResults();
      }
    },
    async pollOcr() {
      await Promise.all([this.loadOcrStatus(), this.refreshVisibleResults()]);
    },
    async refreshVisibleResults() {
      const names = this.images
        .filter((img) => ["queued", "processing"].includes(img.ocr_status))
        .map((img) => img.name);
      if (!names.length) return;
      try {
        const res = await axios.post(
          `${this.apiUrl}/images/ocr/results`,
          { fileNames: names },
          { headers: this.authHeaders() }
        );
        for (const [name, result] of Object.entries(res.data)) {
          if (!this.analyzing[name]) this.applyOcrResult(name, result);
        }
      } catch {
        // nächster Poll versucht es erneut
      }
    },
    setupObserver() {
      if (typeof IntersectionObserver === "undefined") return;
      this.observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) this.loadMore();
        },
        { rootMargin: "400px 0px" }
      );
      if (this.sentinelEl) this.observer.observe(this.sentinelEl);
    },
    // Funktions-Ref: Sentinel existiert nur, solange Bilder gerendert sind
    setSentinel(el) {
      if (el === this.sentinelEl) return;
      if (this.sentinelEl) this.observer?.unobserve(this.sentinelEl);
      this.sentinelEl = el;
      if (el) this.observer?.observe(el);
    },
    deleteImage() {
      const name = this.selectedImage.name;
      axios
        .delete(import.meta.env.VITE_INTERNAL_API_URL + "/images/" + encodeURIComponent(name), {
          headers: this.authHeaders(),
        })
        .then(() => {
          this.images = this.images.filter((image) => image.name !== name);
          this.selectedNames = this.selectedNames.filter((n) => n !== name);
          this.total = Math.max(0, this.total - 1);
          this.selectedImage = null;
          this.toast.add({
            title: "Bild gelöscht",
            description: "Das gewählte Bild wurde erfolgreich gelöscht.",
            icon: "i-lucide-trash-2",
            color: "primary",
          });
        })
        .catch(() => {
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
    this.setupObserver();
    await Promise.all([
      this.loadCameraDevices(),
      this.loadImages(),
      this.loadOcrStatus(),
    ]);
  },
  beforeUnmount() {
    this.observer?.disconnect();
    clearInterval(this.pollTimer);
  },
};
</script>

<style></style>
