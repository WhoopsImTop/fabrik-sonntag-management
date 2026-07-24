<template>
  <div class="rich-text-editor flex flex-col border border-neutral-200 bg-white">
    <div
      v-if="editor"
      class="flex flex-wrap items-center gap-0.5 border-b border-neutral-200 bg-neutral-50 px-2 py-1.5"
    >
      <button
        type="button"
        title="Fett"
        :class="toolbarBtnClass(editor.isActive('bold'))"
        @click="editor.chain().focus().toggleBold().run()"
      >
        <UiIcon name="i-lucide-bold" class="size-3.5" />
      </button>
      <button
        type="button"
        title="Kursiv"
        :class="toolbarBtnClass(editor.isActive('italic'))"
        @click="editor.chain().focus().toggleItalic().run()"
      >
        <UiIcon name="i-lucide-italic" class="size-3.5" />
      </button>
      <button
        type="button"
        title="Unterstrichen"
        :class="toolbarBtnClass(editor.isActive('underline'))"
        @click="editor.chain().focus().toggleUnderline().run()"
      >
        <UiIcon name="i-lucide-underline" class="size-3.5" />
      </button>

      <span class="mx-1 h-4 w-px bg-neutral-200" />

      <button
        type="button"
        title="Link"
        :class="toolbarBtnClass(editor.isActive('link'))"
        @click="setLink"
      >
        <UiIcon name="i-lucide-link" class="size-3.5" />
      </button>
      <button
        type="button"
        title="Link entfernen"
        :class="toolbarBtnClass(false)"
        :disabled="!editor.isActive('link')"
        @click="editor.chain().focus().unsetLink().run()"
      >
        <UiIcon name="i-lucide-unlink" class="size-3.5" />
      </button>

      <span class="mx-1 h-4 w-px bg-neutral-200" />

      <button
        type="button"
        title="Aufzählung"
        :class="toolbarBtnClass(editor.isActive('bulletList'))"
        @click="editor.chain().focus().toggleBulletList().run()"
      >
        <UiIcon name="i-lucide-list" class="size-3.5" />
      </button>
      <button
        type="button"
        title="Nummerierung"
        :class="toolbarBtnClass(editor.isActive('orderedList'))"
        @click="editor.chain().focus().toggleOrderedList().run()"
      >
        <UiIcon name="i-lucide-list-ordered" class="size-3.5" />
      </button>

      <span class="mx-1 h-4 w-px bg-neutral-200" />

      <button
        type="button"
        title="Rückgängig"
        :class="toolbarBtnClass(false)"
        :disabled="!editor.can().undo()"
        @click="editor.chain().focus().undo().run()"
      >
        <UiIcon name="i-lucide-undo-2" class="size-3.5" />
      </button>
      <button
        type="button"
        title="Wiederholen"
        :class="toolbarBtnClass(false)"
        :disabled="!editor.can().redo()"
        @click="editor.chain().focus().redo().run()"
      >
        <UiIcon name="i-lucide-redo-2" class="size-3.5" />
      </button>
    </div>

    <EditorContent :editor="editor" class="rich-text-content flex-1 min-h-0" />
  </div>
</template>

<script setup lang="ts">
import { watch, onBeforeUnmount } from "vue";
import { useEditor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";

const props = withDefaults(
  defineProps<{
    modelValue?: string;
  }>(),
  {
    modelValue: "",
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const editor = useEditor({
  content: props.modelValue,
  immediatelyRender: false,
  extensions: [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: "text-blue-600 underline",
      },
    }),
  ],
  editorProps: {
    attributes: {
      class:
        "prose prose-sm max-w-none focus:outline-none px-3 py-2 min-h-[120px] text-[13px] leading-relaxed text-neutral-800",
    },
  },
  onUpdate: ({ editor: ed }) => {
    emit("update:modelValue", ed.getHTML());
  },
});

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value) return;
    const current = editor.value.getHTML();
    if (value !== current) {
      editor.value.commands.setContent(value || "", { emitUpdate: false });
    }
  },
);

onBeforeUnmount(() => {
  editor.value?.destroy();
});

function toolbarBtnClass(active: boolean) {
  return [
    "inline-flex size-7 items-center justify-center text-neutral-600 transition-colors",
    "hover:bg-neutral-200 hover:text-neutral-900 disabled:opacity-40 disabled:pointer-events-none",
    active ? "bg-neutral-200 text-neutral-900" : "bg-transparent",
  ];
}

function setLink() {
  if (!editor.value) return;
  const previous = editor.value.getAttributes("link").href as string | undefined;
  const url = window.prompt("URL eingeben", previous || "https://");
  if (url === null) return;
  if (url === "") {
    editor.value.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  editor.value
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url })
    .run();
}
</script>

<style scoped>
.rich-text-editor {
  min-height: 120px;
}

.rich-text-content :deep(.tiptap) {
  outline: none;
  min-height: 120px;
}

.rich-text-content :deep(.tiptap p) {
  margin-bottom: 0.75rem;
}

.rich-text-content :deep(.tiptap ul) {
  list-style: disc;
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}

.rich-text-content :deep(.tiptap ol) {
  list-style: decimal;
  padding-left: 1.25rem;
  margin-bottom: 0.75rem;
}

.rich-text-content :deep(.tiptap a) {
  color: #2563eb;
  text-decoration: underline;
}

.rich-text-content :deep(.tiptap p.is-editor-empty:first-child::before) {
  color: #a3a3a3;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
