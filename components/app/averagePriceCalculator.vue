<template>
  <div>
    <h2>Durchschnittlicher Quadratmeter-Mietpreis</h2>
    <ul>
      <li v-for="(avgPrice, region) in avgPrices" :key="region">
        {{ region }}: {{ avgPrice.toFixed(2) }} €/m²
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    data: Object,
    threshold: {
      type: Number,
      default: 100,
    },
  },
  computed: {
    avgPrices() {
      const regionPrices = {};
      const regionCounts = {};

      for (const groupId in this.data) {
        this.data[groupId].forEach((entry) => {
          let price = parseFloat(entry.price.toString().replace(",", "."));
          let sqm = parseFloat(entry.squareMeters.toString().replace(",", "."));

          if (price > this.threshold) {
            price = price / sqm;
          }

          if (!regionPrices[entry.region]) {
            regionPrices[entry.region] = 0;
            regionCounts[entry.region] = 0;
          }
          regionPrices[entry.region] += price;
          regionCounts[entry.region]++;
        });
      }

      console.log(regionPrices);
      const avgPrices = {};
      for (const region in regionPrices) {
        avgPrices[region] = regionPrices[region] / regionCounts[region];
      }
      return avgPrices;
    },
  },
};
</script>
