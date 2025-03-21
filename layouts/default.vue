<template>
  <div class="h-full">
    <AppbarHeader />
    <div class="flex">
      <Sidebar />
      <div class="w-full overflow-y-scroll p-4 max-h-[calc(100vh-60px)]">
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style></style>
