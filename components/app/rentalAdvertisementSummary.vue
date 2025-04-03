<template>
  <div class="mb-2 transition-all">
    <UModal
      :open="history"
      :title="'Datenbankeintrag ' + history?.title + ' löschen?'"
      description="Möchtest du den ausgewählten Datenbankeintrag wirklich löschen?"
    >
      <template #body>
        <UButton
          active
          color="neutral"
          variant="outline"
          active-color="error"
          active-variant="solid"
          @click="deleteDatabaseEntry"
          >Löschen</UButton
        >
      </template>
    </UModal>
    <div
      class="flex items-center justify-between p-4 border border-neutral-200 rounded-lg bg-white"
      :class="isExpanded ? 'rounded-t-lg rounded-b-none' : ''"
    >
      <div class="flex items-center gap-8">
        <a :href="advertisementData.url" target="_blank">
          <img :src="advertisementOwner(advertisementData.url)" class="h-4" />
        </a>
        <span
          class="text-sm font-black max-w-[30vw] overflow-ellipsis whitespace-nowrap overflow-hidden"
          >{{ advertisementData.title }} | {{ advertisementData.address }}</span
        >
      </div>
      <div class="flex items-center gap-16 justify-end">
        <div
          v-if="hasPriceChanged !== 'unchanged'"
          class="flex items-center gap-1 py-2 px-4 bg-amber-400/30 rounded-full"
        >
          <img class="w-4" src="/alert.svg" alt="history" />
          <span class="text-xs font-black">Preisänderung</span>
        </div>

        <p class="text-sm font-black">
          {{ advertisementData.squareMeters }} m²
        </p>
        <p class="text-sm font-black">{{ latestPrice.latestPrice }} €/m²</p>

        <div class="flex items-center gap-1">
          <img class="w-5" src="/history.svg" alt="history" />
          <span class="text-sm font-black">
            {{
              new Date(advertisementData.lastFetch).toLocaleDateString("de-DE")
            }}
          </span>
        </div>

        <!-- Arrow down to expand or collapse the price history -->
        <img
          src="/arrow-down.svg"
          alt="arrow-down"
          @click="togglePriceHistory"
          class="cursor-pointer"
        />
      </div>
    </div>

    <!-- Show price history if expanded -->
    <div
      v-if="isExpanded"
      class="px-4 py-2 border border-neutral-200 rounded-b-lg bg-neutral-50"
    >
      <div
        v-for="(history, index) in advertisementData.priceHistory"
        :key="index"
        class="flex items-center justify-between border-b border-neutral-200 py-2"
      >
        <div class="flex items-center gap-8">
          <UCheckbox
            :model-value="selectedEntries.includes(history.id)"
            @change="toggleSelection(history.id)"
            :label="history.id"
            :key="history.id"
            :id="history.id"
          />
          <p class="text-sm font-semibold">
            Datum:
            {{ new Date(history.createdDate).toLocaleDateString("de-DE") }}
          </p>
          <p class="text-sm">Preis: {{ history.price }} €</p>
          <p class="text-sm">Quadratmeter: {{ history.squareMeters }} m²</p>
        </div>
        <button
          class="rounded-lg border border-neutral-200 p-2 flex items-center justify-center hover:bg-neutral-200 hover:cursor-pointer"
          @click="askForDatabaseEntryDeletion(history)"
        >
          <UIcon name="i-lucide-trash-2" class="size-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
export default {
  props: {
    advertisementData: {
      type: Object,
      required: true,
    },
    averagePrice: {
      type: Number,
    },
    selectedEntries: {
      type: Array,
    },
  },
  data() {
    return {
      isExpanded: false, // Zustand, ob die Preis-Historie angezeigt wird
      history: null,
      toast: useToast(),
    };
  },
  methods: {
    advertisementOwner(link) {
      if (!link) return;
      return link.includes("immowelt")
        ? "./Immowelt_2021_logo.svg"
        : "./Logo_ImmoScout24.svg";
    },
    togglePriceHistory() {
      this.isExpanded = !this.isExpanded; // Toggle für das Anzeigen der Preis-Historie
    },
    askForDatabaseEntryDeletion(history) {
      this.history = history;
    },
    toggleSelection(id) {
      const updatedSelection = this.selectedEntries.includes(id)
        ? this.selectedEntries.filter((entryId) => entryId !== id)
        : [...this.selectedEntries, id];

      this.$emit("update-selected", updatedSelection);
    },
    deleteDatabaseEntry() {
      console.log(this.history);
      axios
        .delete(
          import.meta.env.VITE_INTERNAL_API_URL +
            "/immobilien/" +
            this.history.id
        )
        .then((res) => {
          console.log(res.data);
          this.history = null;
          this.toast.add({
            title: "Datenbankeintrag erfolgreich gelöscht",
            description: "Der Datenbankeintrag wurde aus der Analyse gelöscht.",
            icon: "i-lucide-server",
            color: "primary",
          });
        })
        .catch((err) => {
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
  computed: {
    hasPriceChanged() {
      if (
        !this.advertisementData ||
        !this.advertisementData.priceHistory ||
        this.advertisementData.priceHistory.length < 2
      ) {
        return null; // Wenn keine Preisänderung vorhanden ist oder zu wenige Preise, gibt es keinen Status
      }

      const priceHistory = this.advertisementData.priceHistory;

      let trend = "unchanged"; // Initialer Trend ist "unchanged"

      for (let i = 1; i < priceHistory.length; i++) {
        const previousPrice = parseFloat(
          priceHistory[i - 1].price.replace(",", ".")
        );
        const currentPrice = parseFloat(
          priceHistory[i].price.replace(",", ".")
        );

        if (currentPrice > previousPrice) {
          trend = "higher"; // Wenn ein Preis gestiegen ist, setze Trend auf "higher"
        } else if (currentPrice < previousPrice) {
          trend = "lower"; // Wenn ein Preis gefallen ist, setze Trend auf "lower"
        } // Wenn der Preis gleich bleibt, bleibt der Trend "unchanged"
      }

      return trend; // Gibt "higher", "lower" oder "unchanged" zurück
    },
    latestPrice() {
      if (
        !this.advertisementData ||
        !this.advertisementData.priceHistory ||
        this.advertisementData.priceHistory.length === 0
      )
        return null;

      const latestAd = this.advertisementData; // Da advertisementData ein einzelnes Objekt ist, brauchen wir keinen Loop

      // Entferne den Tausenderpunkt und ersetze das Komma durch einen Punkt
      let latestPrice =
        latestAd.priceHistory[latestAd.priceHistory.length - 1].price;

      // Entferne Tausendertrennzeichen (Punkte) und ersetze Komma durch Punkt
      latestPrice = latestPrice.replace(/\./g, "").replace(",", ".");

      // Konvertiere den Preis in eine Zahl
      latestPrice = parseFloat(latestPrice);

      // Wenn der Preis über dem Schwellenwert liegt (z.B. 200), berechne den Preis pro Quadratmeter
      const priceThreshold = 200; // Schwellenwert für den Preis

      if (latestPrice > priceThreshold) {
        // Sicherstellen, dass die Quadratmeterzahl ein gültiger Wert ist
        const squareMeters = parseFloat(latestAd.squareMeters);

        if (!isNaN(squareMeters) && squareMeters > 0) {
          // Wenn die Quadratmeterzahl gültig ist, teilen wir den Preis durch die Quadratmeter
          latestPrice = Math.round(latestPrice / squareMeters);
        } else {
          console.warn("Ungültige Quadratmeterzahl:", latestAd.squareMeters);
        }
      }

      return {
        groupId: latestAd.groupId,
        latestPrice, // Der berechnete Preis (pro Quadratmeter, wenn der Schwellenwert überschritten wird)
      };
    },
    priceComparison() {
      if (!this.latestPrice || !this.averagePrice) return null;

      return this.latestPrice.map((ad) => ({
        groupId: ad.groupId,
        status:
          ad.latestPrice > this.averagePrice
            ? "über Durchschnitt"
            : ad.latestPrice < this.averagePrice
            ? "unter Durchschnitt"
            : "im Durchschnitt",
      }));
    },
  },
};
</script>

<style></style>
