<template>
  <section>
    <div v-if="imageDates">
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
            class="aspect-video min-w-90 w-90 flex items-center justify-center overflow-hidden rounded-md"
            v-for="image in imageDates[date]"
            :key="image.name"
          >
            <img :src="imagesUrl + image.url" :alt="image.name" />
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex items-center justify-center">
      <div class="flex flex-col items-center justify-center">lade daten...</div>
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
    };
  },
  mounted() {
    const routeParam = this.$route.query;
    axios
      .get(
        import.meta.env.VITE_INTERNAL_API_URL +
          "/images?query" +
          routeParam.query
      )
      .then((res) => {
        const sortedData = Object.entries(res.data)
          .sort(([datumA], [datumB]) => {
            const dateA = new Date(datumA);
            const dateB = new Date(datumB);

            return dateB - dateA;
          })
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {});

        this.imageDates = sortedData;
        this.toast.add({
          title: "Bilder abgerufen",
          description: "Die Zählerbilder wurden erfolgreich abgerufen",
          icon: "i-lucide-image",
          color: 'primary',
        });
      })
      .catch((e) => {
        this.toast.add({
          title: "Fehler beim Laden...",
          description: "Es gab einen Fehler bitte versuche es später erneut.",
          icon: "i-lucide-server-off",
          color: 'error',
        });
      });
  },
};
</script>

<style></style>
