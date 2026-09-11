export type LineDiscountType = "percent" | "amount";

export type InvoiceLineItemForm = {
  description: string;
  quantity: number;
  unit: string;
  amount: number;
  vat_rate: number;
  long_description: string;
  discount_percent: number;
  discount_amount: number;
  discount_type: LineDiscountType;
};

export function emptyInvoiceLineItem(
  overrides: Partial<InvoiceLineItemForm> = {},
): InvoiceLineItemForm {
  return {
    description: "",
    quantity: 1,
    unit: "psch.",
    amount: 0,
    vat_rate: 0.19,
    long_description: "",
    discount_percent: 0,
    discount_amount: 0,
    discount_type: "percent",
    ...overrides,
  };
}

export function mapApiLineItem(item: {
  description?: string;
  quantity?: number | string;
  unit?: string;
  amount?: number | string;
  vat_rate?: number | string;
  long_description?: string | null;
  discount_percent?: number | string | null;
  discount_amount?: number | string | null;
}): InvoiceLineItemForm {
  const discountPercent = Number(item.discount_percent || 0);
  const discountAmount = Number(item.discount_amount || 0);
  return {
    description: item.description || "",
    quantity: Number(item.quantity || 1),
    unit: item.unit || "psch.",
    amount: Number(item.amount || 0),
    vat_rate: Number(item.vat_rate ?? 0.19),
    long_description: item.long_description || "",
    discount_percent: Number.isFinite(discountPercent) ? discountPercent : 0,
    discount_amount: Number.isFinite(discountAmount) ? discountAmount : 0,
    discount_type:
      discountPercent > 0 ? "percent" : discountAmount > 0 ? "amount" : "percent",
  };
}

function round2(value: number): number {
  return Math.round(Number(value) * 100) / 100;
}

export function lineItemNet(item: {
  amount?: number | string;
  quantity?: number | string;
  discount_percent?: number | string;
  discount_amount?: number | string;
}): number {
  const subtotal = Number(item.amount || 0) * Number(item.quantity || 0);
  const cap = Math.max(0, subtotal);
  const percent = Number(item.discount_percent || 0);
  let discount = 0;
  if (percent > 0) discount = subtotal * percent;
  else discount = Number(item.discount_amount || 0);
  discount = round2(Math.min(Math.max(0, discount), cap));
  return round2(subtotal - discount);
}

export function discountDisplayValue(item: InvoiceLineItemForm): number {
  if (item.discount_type === "percent") {
    return Math.round(Number(item.discount_percent || 0) * 10000) / 100;
  }
  return Number(item.discount_amount || 0) || 0;
}

export function setDiscountDisplayValue(
  item: InvoiceLineItemForm,
  raw: string | number,
) {
  const n = Number(raw);
  const value = Number.isFinite(n) ? Math.max(0, n) : 0;
  if (item.discount_type === "percent") {
    item.discount_percent = Math.min(value, 100) / 100;
    item.discount_amount = 0;
  } else {
    item.discount_amount = value;
    item.discount_percent = 0;
  }
}

export function onDiscountInput(
  item: InvoiceLineItemForm,
  event: Event,
) {
  const target = event.target as HTMLInputElement;
  setDiscountDisplayValue(item, target.value);
}

export function onDiscountTypeChange(
  item: InvoiceLineItemForm,
  event: Event,
) {
  const target = event.target as HTMLSelectElement;
  setDiscountType(item, target.value === "amount" ? "amount" : "percent");
}

export function formatDiscountLabel(item: {
  discount_percent?: number | string;
  discount_amount?: number | string;
  discount_type?: LineDiscountType;
}): string {
  const percent = Number(item.discount_percent || 0);
  if (percent > 0) {
    const p = Math.round(percent * 10000) / 100;
    return `${p} %`;
  }
  const amount = Number(item.discount_amount || 0);
  if (amount > 0 || item.discount_type === "amount") {
    return `${amount.toFixed(2)} €`;
  }
  return "0 %";
}
