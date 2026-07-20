export type ToastColor = "primary" | "error" | "neutral" | "green" | "red" | "success";

export interface ToastItem {
  id: number;
  title?: string;
  description?: string;
  color?: ToastColor;
}

const toasts = ref<ToastItem[]>([]);
let nextId = 1;

export const useToast = () => {
  const add = (toast: Omit<ToastItem, "id">) => {
    const id = nextId++;
    toasts.value.push({ id, ...toast });
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id);
    }, 4000);
  };

  const remove = (id: number) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  return {
    toasts,
    add,
    remove,
  };
};
