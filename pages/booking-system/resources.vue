<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-lg font-bold">Buchungssystem Resourcen</h1>
      <button
        class="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-1.5 rounded-lg text-sm px-3 border border-black/10 shadow-sm"
        @click="openModal"
      >
        Resource hinzufügen
      </button>
    </div>

    <table
      class="w-full rounded-lg overflow-hidden border border-black/10 shadow-sm"
    >
      <thead class="bg-neutral-50">
        <tr class="text-left">
          <th class="px-3 py-1.5 text-sm">Name</th>
          <th class="px-3 py-1.5 text-sm">Typ</th>
          <th class="px-3 py-1.5 text-sm">Kapazität</th>
          <th class="px-3 py-1.5 text-sm">Aktiv</th>
          <th class="px-3 py-1.5 text-sm text-right">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in resourceData" :key="item.id">
          <td class="px-3 py-1.5 text-sm">{{ item.title }}</td>
          <td class="px-3 py-1.5 text-sm">{{ item.type }}</td>
          <td class="px-3 py-1.5 text-sm">{{ item.capacity }}</td>
          <td class="px-3 py-1.5 text-sm">
            <span
              :class="
                item.isActive
                  ? 'bg-green-100 text-green-900 px-1.5 py-1 rounded-lg border border-black/10'
                  : 'bg-red-100 text-red-900 px-1.5 py-1 rounded-lg border border-black/10'
              "
              >{{ item.isActive ? "Ja" : "Nein" }}</span
            >
          </td>
          <td class="px-3 py-1.5 text-sm flex items-center gap-1 justify-end">
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-neutral-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="editResource(item)"
            >
              <img src="/edit.svg" alt="edit" title="edit" class="w-4 h-4" />
            </div>
            <div
              class="p-1 rounded-lg bg-neutral-50 hover:bg-red-100 inline-flex items-center justify-center border border-black/10 cursor-pointer"
              @click="deleteResource(item)"
            >
              <img
                src="/trash.svg"
                alt="delete"
                title="delete"
                class="w-4 h-4"
              />
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <app-dialog-resource-form
      v-if="showResourceModal"
      :form="selectedFormData"
      @closeModal="closeModal"
    />
  </div>
</template>

<script setup>
const resourceData = ref([]);
const selectedFormData = ref(null);
const showResourceModal = ref(false);

const closeModal = () => {
  showResourceModal.value = false;
};

const openModal = () => {
  showResourceModal.value = true;
};

const getResources = async () => {
  const res = await fetch(import.meta.env.VITE_INTERNAL_API_URL + "/resources");
  const data = await res.json();

  resourceData.value = data;
};

const deleteResource = async (item) => {
  const res = await fetch(
    import.meta.env.VITE_INTERNAL_API_URL + "/resources/" + item.id,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    }
  );
  const data = await res.json();
  console.log(data);
};

const editResource = (item) => {
  selectedFormData.value = item;
  showResourceModal.value = true;
};

onMounted(() => {
  getResources();
});
</script>

<style></style>
