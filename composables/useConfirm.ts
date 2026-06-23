import { reactive } from "vue";

export type ConfirmVariant = "danger" | "warning" | "default";

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  icon?: string;
};

const defaultConfirmLabels: Record<ConfirmVariant, string> = {
  danger: "Ja, löschen",
  warning: "Ja, fortfahren",
  default: "Bestätigen",
};

const state = reactive({
  isOpen: false,
  title: "",
  description: "",
  confirmLabel: defaultConfirmLabels.default,
  cancelLabel: "Abbrechen",
  variant: "default" as ConfirmVariant,
  icon: undefined as string | undefined,
  loading: false,
});

let resolvePromise: ((value: boolean) => void) | null = null;

export const useConfirm = () => {
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    if (state.isOpen && resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;
    }

    return new Promise((resolve) => {
      resolvePromise = resolve;
      state.title = options.title;
      state.description = options.message ?? "";
      state.variant = options.variant ?? "default";
      state.confirmLabel =
        options.confirmLabel ?? defaultConfirmLabels[state.variant];
      state.cancelLabel = options.cancelLabel ?? "Abbrechen";
      state.icon = options.icon;
      state.loading = false;
      state.isOpen = true;
    });
  };

  const handleConfirm = () => {
    state.isOpen = false;
    resolvePromise?.(true);
    resolvePromise = null;
  };

  const handleCancel = () => {
    state.isOpen = false;
    resolvePromise?.(false);
    resolvePromise = null;
  };

  const setLoading = (loading: boolean) => {
    state.loading = loading;
  };

  return {
    confirm,
    state,
    handleConfirm,
    handleCancel,
    setLoading,
  };
};
