<template>
  <AppAveragePrice :realEstateData="immobilienData" />
  <div class="flex items-center justify-between">
    <UButton @click="openDownloadPage()">Excel herunterladen</UButton
    ><UButton @click="openCleanedDownloadPage()">Excel aufgeräumt herunterladen</UButton>
    <UButton
      :disabled="selectedEntriesFromParent.length === 0"
      @click="deleteSelectedEntries()"
      color="error"
      >Ausgewählte löschen</UButton
    >
  </div>
  <hr class="my-4 border border-neutral-100" />
  <div v-if="transformedData">
    <AppRentalAdvertisementSummary
      v-for="immo in transformedData"
      :key="immo.groupId"
      :advertisement-data="immo"
      v-model:selectedEntries="selectedEntriesFromParent"
      @update-selected="updateSelectedEntries"
    />
  </div>
  <!-- <UTable
    v-if="immobilienData"
    :columns="columns"
    :data="immobilienDataAsArray"
    class="flex-1"
  /> -->
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      immobilienData: null,
      transformedData: null,
      toast: useToast(),
      selectedEntriesFromParent: [],
      columns: [
        {
          accessorKey: "title",
          header: "Titel",
          cell: ({ row }) => `${row.getValue("title")}`,
        },
        {
          accessorKey: "address",
          header: "Adresse",
          cell: ({ row }) => `${row.getValue("address")}`,
        },
        {
          accessorKey: "url",
          header: "Link",
          cell: ({ row }) => {
            return h(
              "a",
              { href: row.getValue("url"), target: "_blank" },
              `Aufrufen`
            );
          },
        },
        {
          accessorKey: "squareMeters",
          header: "m²",
          cell: ({ row }) => `${row.getValue("squareMeters")}`,
        },
        {
          accessorKey: "price",
          header: "Preis",
          cell: ({ row }) => `${row.getValue("price")}`,
        },
        {
          accessorKey: "createdAt",
          header: "Datum",
          cell: ({ row }) => {
            return `${new Date(row.getValue("createdAt")).toLocaleDateString(
              "de-DE"
            )}`;
          },
        },
      ],
    };
  },
  computed: {
    immobilienDataAsArray() {
      return this.immobilienData != null
        ? Object.values(this.immobilienData).flat()
        : [];
    },
  },
  methods: {
    transformAdvertisementData(adData) {
      return Object.keys(adData).map((groupId) => {
        const ads = adData[groupId];

        // Sortiere nach createdDate (älteste zuerst)
        const sortedAds = [...ads].sort(
          (a, b) => new Date(a.createdDate) - new Date(b.createdDate)
        );

        return {
          groupId: groupId,
          title: sortedAds[0].title,
          address: sortedAds[0].address,
          url: sortedAds[0].url,
          squareMeters: sortedAds[0].squareMeters,
          featureTags: sortedAds[0].featureTags,
          lastFetch: sortedAds[sortedAds.length - 1].createdDate, // Neuester Eintrag
          priceHistory: sortedAds.map((ad) => ({
            id: ad.id,
            price: ad.price,
            createdDate: ad.createdDate,
            squareMeters: ad.squareMeters,
          })),
        };
      });
    },
    updateSelectedEntries(newSelection) {
      this.selectedEntriesFromParent = newSelection;
    },
    async deleteSelectedEntries() {
      for (const id of this.selectedEntriesFromParent) {
        try {
          await axios.delete(
            `${import.meta.env.VITE_INTERNAL_API_URL}/immobilien/${id}`
          );

          this.toast.add({
            title: "Datenbankeintrag gelöscht",
            description: `Eintrag ${id} wurde entfernt.`,
            icon: "i-lucide-server",
            color: "primary",
          });
        } catch (err) {
          this.toast.add({
            title: "Fehler beim Löschen...",
            description: `Fehler beim Löschen von ${id}.`,
            icon: "i-lucide-server-off",
            color: "error",
          });
        }
      }

      // Nach dem Löschen Liste leeren
      this.selectedEntriesFromParent = [];
      this.history = null;
    },
    openDownloadPage() {
      window.open(
        `https://haustechnik.fabrik-sonntag.de/api/immobilien/download`
      );
    },
    openCleanedDownloadPage() {
      window.open(
        `https://haustechnik.fabrik-sonntag.de/api/immobilien/download-cleaned`
      );
    },
    fetchImmobiliendata() {
      axios
        .get(import.meta.env.VITE_INTERNAL_API_URL + "/immobilien")
        .then((res) => {
          this.immobilienData = res.data;
          this.transformedData = this.transformAdvertisementData(res.data);
          console.log(this.transformedData);
          this.toast.add({
            title: "Immobilien geladen",
            description: "Die Immobiliendaten wurde erfolgreich geladen.",
            icon: "i-lucide-building",
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
  mounted() {
    this.fetchImmobiliendata();
  },
};
</script>

<style></style>
