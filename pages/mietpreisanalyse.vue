<template>
  <!-- <AppAveragePriceCalculator :data="immobilienData"></AppAveragePriceCalculator> -->
  <UButton @click="openDownloadPage()">Excel herunterladen</UButton>
  <UTable
    v-if="immobilienData"
    :columns="columns"
    :data="immobilienDataAsArray"
    class="flex-1"
  />
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      immobilienData: null,
      toast: useToast(),
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
    openDownloadPage() {
      window.open(
        `https://haustechnik.fabrik-sonntag.de/api/immobilien/download`
      );
    },
    fetchImmobiliendata() {
      axios
        .get(import.meta.env.VITE_INTERNAL_API_URL + "/immobilien")
        .then((res) => {
          this.immobilienData = res.data;
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
