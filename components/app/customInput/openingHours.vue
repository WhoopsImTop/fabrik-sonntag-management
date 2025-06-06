<template>
  <div class="opening-hours-bar">
    <div class="timeline-header">
      <span style="width: 24px"></span>
      <span v-for="h in 9" :key="h">{{ 2 * h + 4 }}:00</span>
    </div>
    <div v-for="(day, dIndex) in days" :key="dIndex" class="timeline-row">
      <input
        type="checkbox"
        v-model="openingHours[dIndex].opened"
        class="day-checkbox"
      />
      <span class="text-xs font-bold uppercase w-8">{{ day.slice(0, 2) }}</span>
      <div class="timeline" v-if="openingHours[dIndex].opened">
        <div
          v-for="(block, bIndex) in openingHours[dIndex].blocks"
          :key="bIndex"
          class="open-bar"
          :style="barStyle(block.open, block.close)"
          @mousedown.stop="startMoveBar(dIndex, bIndex, $event)"
          @contextmenu.prevent="removeBlock(dIndex, bIndex)"
        >
          <div
            class="handle left"
            @mousedown.stop="startDrag(dIndex, bIndex, 'open', $event)"
          ></div>
          <div
            class="handle right"
            @mousedown.stop="startDrag(dIndex, bIndex, 'close', $event)"
          ></div>
          <span class="bar-label">
            {{ formatTime(block.open) }} - {{ formatTime(block.close) }}
          </span>
        </div>
        <button
          class="add-btn"
          @click="addBlock(dIndex)"
          title="Zeitblock hinzufügen"
        >
          +
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "OpeningHoursBar",
  props: {
    openingHoursProp: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      days: [
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag",
        "Sonntag",
      ],
      openingHours: [
        { opened: true, blocks: [{ open: 8.0, close: 16.0 }] }, // Mo
        { opened: true, blocks: [{ open: 8.0, close: 16.0 }] }, // Di
        { opened: true, blocks: [{ open: 8.0, close: 16.0 }] }, // Mi
        { opened: true, blocks: [{ open: 8.0, close: 16.0 }] }, // Do
        { opened: true, blocks: [{ open: 8.0, close: 16.0 }] }, // Fr
        { opened: false, blocks: [] }, // Sa
        { opened: false, blocks: [] }, // So
      ],
      dragging: null, // { dIndex, bIndex, type, offset }
    };
  },
  methods: {
    formatTime(value) {
      const hour = Math.floor(value);
      const min =
        value % 1 === 0.5
          ? "30"
          : value % 1 === 0.25
          ? "15"
          : value % 1 === 0.75
          ? "45"
          : "00";
      return `${hour}:${min}`;
    },
    barStyle(open, close) {
      // Bereich 6-22 Uhr (16 Stunden)
      const minHour = 6;
      const maxHour = 22;
      const left = ((open - minHour) / (maxHour - minHour)) * 100;
      const width = ((close - open) / (maxHour - minHour)) * 100;
      return {
        left: left + "%",
        width: width + "%",
      };
    },
    addBlock(dIndex) {
      // Standardblock im erlaubten Bereich
      this.openingHours[dIndex].blocks.push({ open: 8.0, close: 16.0 });
    },
    removeBlock(dIndex, bIndex) {
      this.openingHours[dIndex].blocks.splice(bIndex, 1);
    },
    startDrag(dIndex, bIndex, type, event) {
      this.dragging = { dIndex, bIndex, type };
      document.addEventListener("mousemove", this.onDrag);
      document.addEventListener("mouseup", this.stopDrag);
    },
    startMoveBar(dIndex, bIndex, event) {
      const timeline = document.querySelectorAll(".timeline")[dIndex];
      const rect = timeline.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const block = this.openingHours[dIndex].blocks[bIndex];
      const minHour = 6;
      const maxHour = 22;
      const barStart =
        ((block.open - minHour) / (maxHour - minHour)) * rect.width;
      const offset = x - barStart;
      this.dragging = { dIndex, bIndex, type: "move", offset };
      document.addEventListener("mousemove", this.onMoveBar);
      document.addEventListener("mouseup", this.stopMoveBar);
    },
    onDrag(event) {
      if (!this.dragging) return;
      const { dIndex, bIndex, type } = this.dragging;
      const timeline = document.querySelectorAll(".timeline")[dIndex];
      const rect = timeline.getBoundingClientRect();
      let x = event.clientX - rect.left;
      x = Math.max(0, Math.min(rect.width, x));
      const minHour = 6;
      const maxHour = 22;
      const value =
        Math.round((x / rect.width) * (maxHour - minHour) * 4) / 4 + minHour;
      const block = this.openingHours[dIndex].blocks[bIndex];
      if (type === "open") {
        block.open = Math.max(minHour, Math.min(value, block.close - 0.25));
      } else if (type === "close") {
        block.close = Math.min(maxHour, Math.max(value, block.open + 0.25));
      }
    },
    onMoveBar(event) {
      if (!this.dragging) return;
      const { dIndex, bIndex, offset } = this.dragging;
      const timeline = document.querySelectorAll(".timeline")[dIndex];
      const rect = timeline.getBoundingClientRect();
      const minHour = 6;
      const maxHour = 22;
      let x = event.clientX - rect.left - offset;
      x = Math.max(0, Math.min(rect.width, x));
      const block = this.openingHours[dIndex].blocks[bIndex];
      const blockWidth =
        ((block.close - block.open) / (maxHour - minHour)) * rect.width;
      let open =
        Math.round((x / rect.width) * (maxHour - minHour) * 4) / 4 + minHour;
      let close = open + (block.close - block.open);

      if (close > maxHour) {
        close = maxHour;
        open = close - (block.close - block.open);
      }
      if (open < minHour) {
        open = minHour;
        close = open + (block.close - block.open);
      }
      block.open = open;
      block.close = close;
    },
    stopDrag() {
      this.dragging = null;
      document.removeEventListener("mousemove", this.onDrag);
      document.removeEventListener("mouseup", this.stopDrag);
      this.submitHours();
    },
    stopMoveBar() {
      this.dragging = null;
      document.removeEventListener("mousemove", this.onMoveBar);
      document.removeEventListener("mouseup", this.stopMoveBar);
      this.submitHours();
    },
    submitHours() {
      const result = {};
      this.days.forEach((day, i) => {
        result[day] = {
          opened: this.openingHours[i].opened,
          blocks: this.openingHours[i].blocks.map((block) => ({
            open: block.open,
            close: block.close,
          })),
        };
      });
      this.$emit("update:openingHours", result);
    },
  },
  mounted() {
    if (this.openingHoursProp) {
      const openingHoursJson = JSON.parse(this.openingHoursProp);
      this.openingHours = this.days.map((day) => ({
        opened: openingHoursJson[day]?.opened || false,
        blocks: openingHoursJson[day]?.blocks || [],
      }));
    }
  },
};
</script>

<style scoped>
.opening-hours-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}
.timeline-header {
  display: flex;
  margin-left: 0;
  font-size: 12px;
  color: #888;
}
.timeline-header span {
  flex: 1;
  text-align: center;
}
.timeline-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}
.day-checkbox {
  margin-right: 6px;
  margin-left: 2px;
}
.timeline {
  position: relative;
  background: #f5f5f5;
  height: 28px;
  flex: 1;
  margin-right: 10px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  min-width: 300px;
}
.open-bar {
  position: absolute;
  top: 3px;
  bottom: 3px;
  background: #b7f5c1;
  border: 1px solid #7fdc9b;
  border-radius: 4px;
  display: flex;
  align-items: center;
  padding-left: 8px;
  font-size: 13px;
  color: #2d7a3b;
  min-width: 40px;
  pointer-events: auto;
  user-select: none;
}
.bar-label {
  font-size: 12px;
  font-weight: bold;
  margin: 0 auto;
  pointer-events: none;
}
.handle {
  width: 16px;
  height: 16px;
  background: #fff;
  border: 2px solid #7fdc9b;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  cursor: ew-resize;
  pointer-events: auto;
}
.handle.left {
  left: -8px;
}
.handle.right {
  right: -8px;
}
.add-btn {
  margin-left: 6px;
  font-size: 16px;
  background: #e6f9ed;
  border: 1px solid #7fdc9b;
  border-radius: 50%;
  cursor: pointer;
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
