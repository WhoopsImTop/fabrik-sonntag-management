<template>
  <div class="mb-8">
    <h2 class="text-lg font-bold mb-4">
      Durchschnittliche Mietpreise nach Region
    </h2>
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <a
        class="p-4 rounded-lg shadow-sm bg-neutral-50"
        v-for="(data, region) in averagePrices"
        :key="region"
        :href="'#'+region"
      >
        <p class="text-sm font-bold">{{ region }}</p>
        <p class="text-lg">Ø {{ data.averagePricePerSqm.toFixed(2) }} €/m²</p>
        <p class="text-xs">Min Fläche: {{ data.minSquareMeters }} m²</p>
        <p class="text-xs">Max Fläche: {{ data.maxSquareMeters }} m²</p>
        <p class="text-xs">Objekte: {{ data.count }}</p>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    realEstateData: {
      type: Object,
      required: true,
    },
  },
  computed: {
    averagePrices() {
      const regionData = {};

      for (const groupId in this.realEstateData) {
        const latestEntry = this.getLatestEntry(this.realEstateData[groupId]);
        if (!latestEntry) continue;

        const squareMeters = parseFloat(
          latestEntry.squareMeters.replace(".", "")
        );
        const price = parseFloat(latestEntry.price.replace(".", ""));

        if (!isNaN(squareMeters) && !isNaN(price) && squareMeters > 0) {
          const sqmPrice = price / squareMeters;

          const regionKey = this.normalizeRegion(
            latestEntry.address ? latestEntry.address : latestEntry.region
          );

          if (!regionData[regionKey]) {
            regionData[regionKey] = {
              totalPrice: 0,
              totalArea: 0,
              minSquareMeters: Infinity,
              maxSquareMeters: -Infinity,
              count: 0,
            };
          }

          // Werte für die Region aktualisieren
          regionData[regionKey].totalPrice += price;
          regionData[regionKey].totalArea += squareMeters;
          regionData[regionKey].minSquareMeters = Math.min(
            regionData[regionKey].minSquareMeters,
            squareMeters
          );
          regionData[regionKey].maxSquareMeters = Math.max(
            regionData[regionKey].maxSquareMeters,
            squareMeters
          );
          regionData[regionKey].count++;
        }
      }

      // Durchschnittspreis pro Quadratmeter berechnen
      const result = {};
      for (const region in regionData) {
        result[region] = {
          averagePricePerSqm:
            regionData[region].totalPrice / regionData[region].totalArea,
          minSquareMeters:
            regionData[region].minSquareMeters === Infinity
              ? null
              : regionData[region].minSquareMeters,
          maxSquareMeters:
            regionData[region].maxSquareMeters === -Infinity
              ? null
              : regionData[region].maxSquareMeters,
          count: regionData[region].count,
        };
      }

      return result;
    },
  },
  methods: {
    normalizeRegion(region) {
      if (!region) return "Unbekannt";

      const standardizedRegions = [
        "Brühl",
        "Freiburg",
        "Waldkirch",
        "Emmendingen",
        "Gundelfingen",
        "Elzach",
        "Denzlingen",
      ];

      for (const stdRegion of standardizedRegions) {
        if (region.includes(stdRegion)) {
          return stdRegion;
        }
      }

      return region;
    },
    getLatestEntry(entries) {
      return entries.reduce((latest, entry) => {
        return !latest || new Date(entry.createdAt) > new Date(latest.createdAt)
          ? entry
          : latest;
      }, null);
    },
  },
};
</script>

<style scoped>
ul {
  list-style-type: none;
  padding: 0;
}
li {
  margin: 5px 0;
}
</style>
