# Frontend → API Routen

Dokumentation der Seiten im Management-Frontend (`fabrik-sonntag-management`) und der verwendeten Backend-Endpunkte (`fabrik-sonntag-api`).

**Base-URL:** `VITE_INTERNAL_API_URL` (z. B. `https://…/api`)  
**Auth:** JWT in `localStorage` (`jwt`), gesetzt nach Login; globaler Fetch-Patch in `plugins/auth.js`.

Zentrale Clients:

- `composables/useBookingApi.ts` — Buchungssystem, Nutzer, Sales, Templates, Auth (change-password)
- `composables/useMeterApi.ts` — Zähler & Readings

---

## Auth & Account

### `/login` — `pages/login.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| POST | `/auth/login` | Anmeldung |

### `/request-password-reset` — `pages/request-password-reset.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| POST | `/auth/request-password-reset` | Reset-Link anfordern |

### `/reset-password` — `pages/reset-password.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| POST | `/auth/reset-password` | Neues Passwort setzen |

### `/change-password` — `pages/change-password.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| POST | `/auth/change-password` | Passwort ändern (`useBookingApi.auth`) |

### `/settings` — `pages/settings/index.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/settings` | Einstellungen laden |
| PUT | `/settings` | Einstellungen speichern |

> **Hinweis:** Backend stellt aktuell nur `/settings/company` bereit. Diese Seite ruft `/settings` auf — möglicher Mismatch.

---

## Campus / Karte

### `/` — `pages/index.vue` → `components/app/mapComponent.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/pois` | POIs laden |
| POST | `/pois` | Neuen POI anlegen |
| PATCH | `/pois/:id` | POI aktualisieren |
| POST | `/export/poi-overview` | PDF-Export |

Dialoge (von der Karte geöffnet):

#### `components/app/dialog/poi.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/pois/:id/renters` | Mieter eines POI |
| DELETE | `/renters/:id` | Mieter löschen |
| PATCH | `/sort/floor/:floorId/renters` | Mieter-Reihenfolge |
| GET | `/media` | Medienliste |
| GET/POST | `/pois/:id/panorama-scenes` | 360°-Szenen laden/anlegen |
| PUT | `/pois/:id/panorama-scenes/reorder` | Szenen-Reihenfolge |
| PATCH/DELETE | `/panorama-scenes/:id` | Szene aktualisieren/löschen |
| POST | `/panorama-scenes/:id/hotspots` | Hotspot anlegen |
| PATCH/DELETE | `/panorama-hotspots/:id` | Hotspot aktualisieren/löschen |

#### `components/app/dialog/RenterForm.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET/POST/PATCH/DELETE | `/floors`, `/floors/:id` | Etagen CRUD |
| PATCH | `/areas/:id` | Fläche aktualisieren |
| GET | Media (Image-URL) | Medien |
| POST/PATCH | `/renters`, `/renters/:id` | Mieter speichern |

#### `components/app/dialog/AreaEditor.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET/POST/PATCH/DELETE | `/floors`, `/floors/:id` | Etagen |
| PATCH/DELETE | `/areas/:id` | Flächen |

#### `components/app/MediaLibrary.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/media` | Liste |
| POST | `/media/upload` | Upload |
| DELETE | `/media/:id` | Löschen |

---

## Gebäude / Haustechnik

### `/haus-5` — `pages/haus-5/index.vue`

Keine API-Calls.

### `/haus-5/haustechnik` — `pages/haus-5/haustechnik.vue` → `components/app/imageGallery.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/images` | Bildergalerie laden |
| DELETE | `/images/:name` | Bild löschen |

---

## Mietpreisanalyse

### `/mietpreisanalyse` — `pages/mietpreisanalyse.vue` (+ `rentalAdvertisementSummary.vue`)

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/immobilien` | Anzeigen laden |
| DELETE | `/immobilien/:id` | Eintrag löschen |
| GET | `/immobilien/download` | Excel-Download |
| GET | `/immobilien/download-cleaned` | Excel aufgeräumt |

---

## Zählerverwaltung

### `/meters` — `pages/meters/index.vue` (`useMeterApi`)

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/meters` | Zählerliste |
| POST | `/meters` | Zähler anlegen / Mass-Import |
| PUT | `/meters/:meter_id` | Zähler aktualisieren |
| DELETE | `/meters/:meter_id` | Zähler löschen |
| GET | `/meters/groups` | Gruppenliste |
| POST | `/meters/groups` | Gruppe anlegen |
| PUT | `/meters/groups/:id` | Gruppe aktualisieren |
| DELETE | `/meters/groups/:id` | Gruppe löschen |
| GET | `/mbus/export/csv/:meter_id` | CSV-Export |

### `/meters/readings` — `pages/meters/readings.vue` (`useMeterApi`)

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/meters/readings` | Zählerstände laden |
| DELETE | `/meters/readings/:id` | Einzelnen Stand löschen |
| DELETE | `/meters/readings` | Alle Stände löschen |

---

## Embed

### `/embed/widget` — `pages/embed/widget.vue`

Externe URL über Query-Parameter `apiUrl` (kein internes Backend).

---

## Buchungssystem

Shared Client: `useBookingApi`.

### `/booking-system` — `pages/booking-system/index.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/bookings` | Buchungen (Dashboard) |
| GET | `/resources` | Ressourcen |
| GET | `/sales/invoices` | Rechnungen |
| GET | `/users` | Nutzer |

### `/booking-system/calendar` — `pages/booking-system/calendar.vue` + Booking-Komponenten

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/bookings` | Kalenderdaten |
| GET | `/resources` | Ressourcen |
| PATCH | `/bookings/:id` | Buchung bearbeiten |
| DELETE | `/bookings/:id` | Buchung löschen |
| GET | `/bookings/availabilities` | Verfügbarkeit (`BookingFormModal`) |
| POST | `/bookings/createBooking` | Neue Buchung |
| PATCH | `/bookings/cancel/:id` | Stornieren (`BookingDetails`) |
| GET | `/sales/invoices/:id/download` | Rechnung herunterladen |
| GET | `/users` | Nutzerauswahl |
| GET | `/pricing` | Preispläne |
| GET | `/welcome/list-vouchers` | Voucher (`voucherModal`) |
| GET | `/welcome/get-templates` | Welcome-Templates |
| POST | `/welcome/create-vouchers` | Voucher erstellen |
| POST | `/welcome/send-welcome-email` | Welcome-Mail |
| GET | `/communications` | Kommunikationshistorie |

### `/booking-system/users` — `pages/booking-system/users/index.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/users` | Nutzerliste |
| POST | `/users` | Nutzer anlegen |

### `/booking-system/users/:id` — `pages/booking-system/users/[id].vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/users/:id` | Nutzerdetail |
| PATCH | `/users/:id` | Nutzer aktualisieren |
| DELETE | `/users/:id` | Nutzer löschen |
| GET | `/memberships/types` | Mitgliedschaftstypen |
| GET | `/resources` | Ressourcen |
| GET | `/pricing` | Preise |
| POST | `/quotas/assign` | Kontingent zuweisen |
| DELETE | `/quotas/:id` | Kontingent entfernen |
| POST | `/memberships/assign` | Mitgliedschaft zuweisen |
| DELETE | `/memberships/assign/:id` | Mitgliedschaft entfernen |
| GET | `/sales/invoices/:id/download` | Rechnung |
| GET | `/communications` | Kommunikation |

### `/booking-system/resources` — `pages/booking-system/resources.vue` + Wizard/EditModal

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/resources` | Liste |
| GET | `/resources/categories` | Kategorien |
| POST | `/resources/categories` | Kategorie anlegen |
| POST | `/resources` | Ressource anlegen (Wizard) |
| PATCH | `/resources/:id` | Ressource bearbeiten |
| DELETE | `/resources/:id` | Ressource löschen |
| POST | `/pricing` | Preisplan anlegen |
| GET/POST/PATCH/DELETE | `/pricing`, `/pricing/:id` | Pricing-Tab |
| POST | `/services/attach` | Service verknüpfen |
| PATCH | `/resources/:id/services` | Services aktualisieren |

### `/booking-system/services` — `pages/booking-system/services.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/services` | Liste |
| POST | `/services` | Anlegen |
| PATCH | `/services/:id` | Aktualisieren |
| DELETE | `/services/:id` | Löschen |

### `/booking-system/pricing` — `pages/booking-system/pricing.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/pricing` | Preisliste |
| GET | `/resources` | Ressourcen-Lookup |
| POST | `/pricing` | Anlegen |
| PATCH | `/pricing/:id` | Aktualisieren |
| DELETE | `/pricing/:id` | Löschen |

### `/booking-system/memberships` — `pages/booking-system/memberships/index.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/memberships/types` | Typen |
| GET | `/resources/categories` | Kategorien |
| POST | `/memberships/types` | Typ anlegen |
| PATCH | `/memberships/types/:id` | Typ aktualisieren |
| DELETE | `/memberships/types/:id` | Typ löschen |
| POST | `/memberships/rules` | Regel anlegen |
| DELETE | `/memberships/rules/:id` | Regel löschen |

### `/booking-system/subscriptions` — `pages/booking-system/subscriptions/index.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/subscriptions` | Abo-Liste |
| PATCH | `/subscriptions/:id` | Abo aktualisieren |
| DELETE | `/subscriptions/:id` | Abo löschen |

### `/booking-system/subscriptions/:id` — `pages/booking-system/subscriptions/[id].vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/subscriptions` | Abo-Daten |
| GET | `/users`, `/resources`, `/services`, `/pricing` | Lookups |
| POST | `/users` | Nutzer anlegen |
| POST | `/subscriptions` | Abo anlegen |
| PATCH | `/subscriptions/:id` | Abo aktualisieren |

### `/booking-system/invoices` — `pages/booking-system/invoices/index.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/sales/invoices` | Rechnungsliste |
| PATCH | `/sales/invoices/:id` | Rechnung aktualisieren |
| PATCH | `/users/:id` | Nutzer (Nebenwirkung) |
| GET | `/sales/accounting/export` | Buchhaltungsexport |
| POST | `/sales/invoices/bulk-download` | Sammel-Download |

### `/booking-system/invoices/new` — `pages/booking-system/invoices/new.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/users`, `/resources`, `/services`, `/pricing`, `/bookings` | Lookups |
| POST | `/users` | Nutzer anlegen |
| POST | `/sales/invoices` | Rechnung erstellen |

### `/booking-system/invoices/:id` — `pages/booking-system/invoices/[id].vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/sales/invoices/:id` | Detail |
| GET | Lookups (users/resources/…) | Formular |
| PATCH | `/sales/invoices/:id` | Aktualisieren |
| DELETE | `/sales/invoices/:id` | Löschen |
| POST | `/sales/invoices/:id/send` | Per E-Mail senden |
| GET | `/sales/invoices/:id/download` | Download |
| PATCH | `/sales/invoices/:id/payment` | Zahlungsstatus (`useBookingApi`) |

> **Hinweis:** `PATCH /sales/invoices/:id/payment` ist im Frontend-Client definiert; Backend-Route ggf. prüfen.

### `/booking-system/email-templates` — `pages/booking-system/email-templates.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/templates` | Vorlagenliste |
| POST | `/templates` | Vorlage anlegen |
| PATCH | `/templates/:id` | Vorlage speichern |
| POST | `/templates/upload-attachments` | Anhänge hochladen |

### `/booking-system/settings` — `pages/booking-system/settings.vue` + MediaLibrary

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/settings/company` | Firmeneinstellungen |
| PATCH | `/settings/company` | Speichern |
| GET | `/media/:id` | Logo/Medien |
| POST | `/billing/run` | Billing-Lauf |
| GET | `/media` | MediaLibrary |
| POST | `/media/upload` | Upload |
| DELETE | `/media/:id` | Löschen |

### `/booking-system/profile` — `pages/booking-system/profile.vue`

| Methode | API-Pfad | Kontext |
|---------|----------|---------|
| GET | `/users/profile` | Profil |
| PATCH | `/users/profile` | Profil speichern |
| GET | `/memberships/my` | Eigene Mitgliedschaften |
| GET | `/bookings` | Eigene Buchungen |

---

## Bekannte Abweichungen Frontend ↔ Backend

| Frontend-Call | Status |
|---------------|--------|
| GET/PUT `/settings` (`pages/settings`) | Backend: nur `/settings/company` |
| PATCH `/sales/invoices/:id/payment` | In `useBookingApi`, Backend ggf. fehlend |
| GET `/bookings/price?...` | In `useBookingApi`, Backend ggf. fehlend |

---

## Backend-Endpunkte (Übersicht, Express)

Mount: `fabrik-sonntag-api` unter `/api/*`.

| Bereich | Basispfad |
|---------|-----------|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Resources | `/api/resources` |
| Services | `/api/services` |
| Pricing | `/api/pricing` |
| Memberships | `/api/memberships` |
| Quotas | `/api/quotas` |
| Bookings | `/api/bookings` |
| Sales | `/api/sales` |
| Settings | `/api/settings/company` |
| Templates | `/api/templates` |
| Subscriptions | `/api/subscriptions` |
| Billing | `/api/billing` |
| Welcome | `/api/welcome` |
| Communications | `/api/communications` |
| Meters / WMBus | `/api/meters`, `/api/mbus` |
| Immobilien | `/api/immobilien` |
| Images | `/api/images` |
| Map (POI/Areas/Floors/Renters/Media/Sort) | `/api/pois`, `/api/areas`, `/api/floors`, `/api/renters`, `/api/media`, `/api/sort`, `/api/export` |
