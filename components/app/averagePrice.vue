<template>
  <div class="mb-8">
    <h2 class="text-lg font-bold mb-4">Durchschnittliche Mietpreise nach Region</h2>
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      <div class="p-4 rounded-lg shadow-sm bg-neutral-50" v-for="(average, region) in averagePrices" :key="region">
        <p class="text-sm font-bold">{{ region }}</p>
        <p class="text-lg">{{ average.toFixed(2) }} €/m²</p>
      </div>
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

        if (!isNaN(squareMeters) && !isNaN(price)) {
          const regionKey = this.normalizeRegion(
            latestEntry.region ? latestEntry.region : latestEntry.address
          );

          if (!regionData[regionKey]) {
            regionData[regionKey] = { totalPrice: 0, totalArea: 0 };
          }
          regionData[regionKey].totalPrice += price;
          regionData[regionKey].totalArea += squareMeters;
        }
      }
      console.log(regionData);
      const averages = {};
      for (const region in regionData) {
        averages[region] =
          regionData[region].totalPrice / regionData[region].totalArea;
      }

      return averages;
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
