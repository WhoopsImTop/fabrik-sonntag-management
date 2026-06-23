# ConfirmationModal — Bestätigungs-Dialog

Wiederverwendbare Bestätigungs-UI für destruktive oder irreversible Aktionen (Storno, Löschen, E-Mail-Versand). Ersetzt natives `window.confirm()` durch ein konsistentes Modal auf Basis von Nuxt UI (`UModal`).

**Komponente:** `components/app/ConfirmationModal.vue`  
**Composable:** `composables/useConfirm.ts`  
**Globaler Mount:** `app.vue` (Singleton für `useConfirm()`)

> **Hinweis:** Die Komponente liegt unter `components/app/` und muss in Dateien außerhalb von Nuxt-Auto-Import explizit importiert werden:
> `import ConfirmationModal from "@/components/app/ConfirmationModal.vue"`

---

## Wann was nutzen?

| Situation | Empfehlung |
|-----------|------------|
| Einfache Ja/Nein-Bestätigung in einer Action-Funktion | `useConfirm()` (imperativ) |
| Zusatzinhalt im Dialog (Checkbox, Hinweistext mit Formatierung) | Deklarative `<ConfirmationModal>` mit Slot |

Das Composable ist in `app.vue` global eingebunden. Ein Aufruf von `useConfirm()` öffnet das zentrale Modal; es kann immer nur ein Dialog gleichzeitig offen sein.

---

## Props (ConfirmationModal)

| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| `open` | `boolean` | — | Sichtbarkeit (`v-model:open`) |
| `title` | `string` | — | Überschrift |
| `description` | `string` | `''` | Fließtext / Warnung |
| `confirmLabel` | `string` | je nach Variante | Primär-Button |
| `cancelLabel` | `string` | `'Abbrechen'` | Sekundär-Button |
| `variant` | `'danger' \| 'warning' \| 'default'` | `'default'` | Button-Stil und Default-Label |
| `loading` | `boolean` | `false` | Ladezustand auf dem Bestätigen-Button |
| `icon` | `string` | — | Heroicon-Name (z. B. `i-heroicons-envelope-20-solid`) |

**Emits:** `confirm`, `cancel`, `update:open`  
**Slot `#default`:** Optionaler Zusatzinhalt unter der Beschreibung

### Varianten

- `danger` — Rote Bestätigung, Default-Label „Ja, löschen“ (Löschen, unwiderrufliche Aktionen)
- `warning` — Amber-Ton, Default-Label „Ja, fortfahren“ (Storno, Abo beenden)
- `default` — Primärfarbe, Default-Label „Bestätigen“ (E-Mail senden, neutrale Bestätigungen)

---

## Beispiel 1: Imperativ mit `useConfirm()` (Storno)

```ts
const { confirm } = useConfirm();

const stornoInvoice = async () => {
  const confirmed = await confirm({
    title: "Rechnung stornieren",
    message:
      "Diese Rechnung stornieren? Die Rechnungsnummer bleibt dauerhaft vergeben.",
    variant: "warning",
    confirmLabel: "Ja, stornieren",
    icon: "i-heroicons-exclamation-triangle-20-solid",
  });
  if (!confirmed) return;

  await api.sales.update(id, { status: "DELETED" });
};
```

---

## Beispiel 2: E-Mail-Versand bestätigen

```ts
const sendInvoiceEmail = async () => {
  const confirmed = await confirm({
    title: "Rechnung per E-Mail senden",
    message: `Rechnung jetzt per E-Mail an ${email} senden?`,
    variant: "default",
    confirmLabel: "Ja, senden",
    icon: "i-heroicons-envelope-20-solid",
  });
  if (!confirmed) return;

  await api.sales.sendEmail(id);
};
```

---

## Beispiel 3: Deklarativ mit Slot (Checkbox im Dialog)

Für Aktionen mit Zusatzoptionen, z. B. E-Mail-Benachrichtigung bei Buchungs-Storno:

```vue
<ConfirmationModal
  v-model:open="showCancelModal"
  title="Buchung stornieren"
  description="Möchten Sie diese Buchung wirklich stornieren?"
  variant="warning"
  confirm-label="Ja, stornieren"
  @confirm="confirmCancel"
>
  <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
    <input v-model="shouldSendEmail" type="checkbox" />
    Kunden per E-Mail benachrichtigen
  </label>
</ConfirmationModal>
```

```ts
const showCancelModal = ref(false);

const handleCancel = () => {
  showCancelModal.value = true;
};

const confirmCancel = async () => {
  showCancelModal.value = false;
  await api.bookings.cancel(bookingId, shouldSendEmail.value);
};
```

---

## Bereits eingebundene Stellen

- `pages/booking-system/invoices/[id].vue` — Rechnung senden, stornieren, löschen
- `components/booking/BookingDetails.vue` — Buchung stornieren (mit Checkbox), löschen
- `pages/booking-system/subscriptions/index.vue` — Abo beenden, löschen
- `pages/booking-system/calendar.vue` — Doppelbestätigung beim Löschen entfernt (Bestätigung nur in `BookingDetails`)
- `components/booking/voucherModal.vue` — Willkommens-E-Mail senden

Weitere `window.confirm()`-Stellen im Projekt können schrittweise mit demselben Pattern migriert werden.

---

## Hinweise

- Erfolgs- und Fehlermeldungen nach der Bestätigung weiterhin über bestehende Mechanismen (z. B. Toasts in `useBookingApi`, `alert()` wo noch vorhanden). Das Modal dient **nur** der Vorab-Bestätigung.
- Escape-Taste und Klick auf den Backdrop schließen den Dialog und werten als Abbrechen (`false` bei `useConfirm()`).
- Bei deklarativer Nutzung: Modal nach `@confirm` manuell schließen (`showModal = false`), da der Bestätigen-Button das Modal nicht automatisch schließt.
