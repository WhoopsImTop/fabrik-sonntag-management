<template>
  <div v-if="loading" class="flex justify-center flex-col gap-4 items-center min-h-[50vh]">
    <svg class="animate-spin w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
      </path>
    </svg>
    <p class="text-sm font-medium text-neutral-500 animate-pulse">Lade Daten...</p>
  </div>

  <div v-else-if="!invoice" class="text-center py-12">
    <h2 class="text-xl font-semibold text-neutral-900">Rechnung nicht gefunden</h2>
    <button @click="router.back()" class="mt-4 text-brand-accent underline underline-offset-2 hover:brightness-90">Zurück</button>
  </div>

  <div v-else class="max-w-7xl mx-auto space-y-6 pb-24 font-sans text-neutral-900">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <button @click="router.back()"
            class="inline-flex h-8 w-8 items-center justify-center rounded-none hover:bg-neutral-100 text-neutral-500 transition-colors">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div class="flex items-center gap-3">
            <h2 class="text-2xl font-semibold tracking-tight">{{ invoice.invoice_number }}</h2>
            <span :class="[
              'inline-flex items-center rounded-none border px-2.5 py-0.5 text-xs font-semibold transition-colors',
              getStatusClass(invoice.status),
            ]">
              {{ getStatusLabel(invoice.status) }}
            </span>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <template v-if="isEditing && isDraft">
          <button type="button" class="btn-dialog-cancel" @click="toggleEditMode">
            Abbrechen
          </button>
          <button type="button" class="btn-dialog-primary" :disabled="saving" @click="saveInvoice">
            <svg v-if="saving" class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            Speichern
          </button>
        </template>
        <template v-else>
          <button type="button" class="btn-dialog-cancel gap-2" @click="handleDownload">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            PDF Laden
          </button>
          <button
            v-if="!isStorno"
            type="button"
            class="btn-dialog-primary"
            @click="openEmailPreview"
          >
            Email senden
          </button>
          <button
            v-if="isLockedAfterSend && invoice.status !== 'PAID'"
            type="button"
            class="btn-dialog-cancel border-emerald-200 text-emerald-800 hover:bg-emerald-50"
            @click="markInvoicePaid"
          >
            Als bezahlt markieren
          </button>
          <button
            v-if="canStornoInvoice"
            type="button"
            class="btn-dialog-cancel border-amber-200 text-amber-900 hover:bg-amber-50"
            @click="stornoInvoice"
          >
            Stornieren
          </button>
          <button
            v-if="isDraft"
            type="button"
            class="btn-dialog-cancel"
            @click="toggleEditMode"
          >
            Bearbeiten
          </button>
          <button
            v-if="canDeleteInvoice"
            type="button"
            class="btn-dialog-danger"
            @click="handleDelete"
          >
            Löschen
          </button>
        </template>
      </div>
    </div>

    <div class="space-y-4">
      <div class="border border-neutral-200 bg-white text-neutral-950">
        <div class="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100">
          <div class="min-w-0">
            <h3 class="font-semibold leading-none tracking-tight">Empfänger</h3>
            <p class="text-xs text-neutral-500 mt-1 truncate">
              {{ isEditing && isDraft
                ? 'Suche füllt vor — Änderungen gelten nur für diese Rechnung.'
                : 'Empfänger dieser Rechnung (Snapshot).' }}
            </p>
          </div>
          <span v-if="form.user_id || invoice.User"
            class="shrink-0 inline-flex items-center rounded-none border border-emerald-200 px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800">Verknüpft</span>
          <span v-else
            class="shrink-0 inline-flex items-center rounded-none border border-neutral-200 px-2 py-0.5 text-xs font-semibold bg-neutral-100 text-neutral-500">Ohne Konto</span>
        </div>

        <div class="p-4 space-y-3">
          <template v-if="isEditing && isDraft">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-600">Kunden suchen</label>
                <div v-if="form.user_id"
                  class="flex h-9 items-center justify-between px-2 rounded-none border border-neutral-200 bg-neutral-50">
                  <div class="flex flex-col overflow-hidden min-w-0">
                    <span class="text-sm font-medium truncate">{{ form.user_preview?.username || "User ID: " + form.user_id }}</span>
                  </div>
                  <button type="button" @click="removeUser"
                    class="shrink-0 text-neutral-400 hover:text-red-500 p-1"
                    title="Verknüpfung entfernen">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div v-else class="relative group">
                  <svg class="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" v-model="userSearchQuery" @input="handleUserSearch"
                    class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 pl-9 text-sm transition-colors placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950"
                    placeholder="Name, Firma oder E-Mail..." />
                  <div v-if="userSearchResults.length > 0"
                    class="absolute z-50 mt-1 w-full rounded-none border border-neutral-200 bg-white text-neutral-950 shadow-md outline-none">
                    <div class="max-h-60 overflow-y-auto p-1">
                      <div v-for="user in userSearchResults" :key="user.id" @click="selectUser(user)"
                        class="relative flex cursor-pointer select-none flex-col px-2 py-1.5 text-sm outline-none hover:bg-neutral-100">
                        <span class="font-medium">{{ user.details?.company || user.username }}</span>
                        <span class="text-xs text-neutral-500">{{ user.email }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-600">Kundentyp</label>
                <div class="flex border border-neutral-200 overflow-hidden h-9">
                  <button type="button" @click="customerForm.user_type = 'PERSON'"
                    :class="['flex-1 px-3 text-xs font-medium transition-colors', customerForm.user_type === 'PERSON' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50']">Person</button>
                  <button type="button" @click="customerForm.user_type = 'COMPANY'"
                    :class="['flex-1 px-3 text-xs font-medium transition-colors', customerForm.user_type === 'COMPANY' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50']">Firma</button>
                </div>
              </div>

              <div v-if="customerForm.user_type === 'COMPANY'" class="flex items-end pb-2">
                <div class="flex items-center gap-2">
                  <input id="edit_display_contact_person" type="checkbox" v-model="customerForm.display_contact_person"
                    class="border-neutral-300 text-neutral-900 focus:ring-neutral-900 rounded-none" />
                  <label for="edit_display_contact_person" class="text-xs text-neutral-700">Ansprechpartner anzeigen</label>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-600">Vorname</label>
                <input v-model="customerForm.first_name"
                  class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-600">Nachname</label>
                <input v-model="customerForm.last_name"
                  class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-600">Firma</label>
                <input v-model="customerForm.company"
                  class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-600">E-Mail</label>
                <input v-model="customerForm.email" type="email"
                  class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-600">Telefon</label>
                <input v-model="customerForm.phone" type="tel"
                  class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-600">Land</label>
                <input v-model="customerForm.country"
                  class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div class="col-span-2 sm:col-span-3 space-y-1">
                <label class="text-xs font-medium text-neutral-600">Straße</label>
                <input v-model="customerForm.street"
                  class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-600">Nr.</label>
                <input v-model="customerForm.house_number"
                  class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              </div>
              <div class="space-y-1">
                <label class="text-xs font-medium text-neutral-600">PLZ</label>
                <input v-model="customerForm.zip_code"
                  class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              </div>
              <div class="col-span-2 sm:col-span-1 space-y-1">
                <label class="text-xs font-medium text-neutral-600">Stadt</label>
                <input v-model="customerForm.city"
                  class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              </div>
            </div>
          </template>
          <template v-else>
            <div class="space-y-3 text-sm">
              <div v-if="form.user_id || invoice.User" class="flex items-center gap-3 pb-2 border-b border-neutral-100">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-medium text-neutral-900">
                  {{ (invoice.User?.username || '?').substring(0, 2).toUpperCase() }}
                </div>
                <div class="overflow-hidden">
                  <p class="font-medium text-neutral-900 truncate">{{ invoice.User?.username || 'Konto #' + form.user_id }}</p>
                  <p class="text-xs text-neutral-500 truncate">Verknüpftes Kundenkonto</p>
                </div>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <div class="text-xs text-neutral-500">Typ</div>
                  <div>{{ customerForm.user_type === 'COMPANY' ? 'Firma' : 'Person' }}</div>
                </div>
                <div v-if="customerForm.company">
                  <div class="text-xs text-neutral-500">Firma</div>
                  <div>{{ customerForm.company }}</div>
                </div>
                <div v-if="customerForm.first_name || customerForm.last_name">
                  <div class="text-xs text-neutral-500">{{ customerForm.user_type === 'COMPANY' ? 'Ansprechpartner' : 'Name' }}</div>
                  <div>{{ [customerForm.first_name, customerForm.last_name].filter(Boolean).join(' ') }}</div>
                </div>
                <div v-if="customerForm.email">
                  <div class="text-xs text-neutral-500">E-Mail</div>
                  <div class="truncate">{{ customerForm.email }}</div>
                </div>
                <div v-if="customerForm.phone">
                  <div class="text-xs text-neutral-500">Telefon</div>
                  <div>{{ customerForm.phone }}</div>
                </div>
                <div v-if="customerForm.street || customerForm.city">
                  <div class="text-xs text-neutral-500">Adresse</div>
                  <div>
                    {{ [customerForm.street, customerForm.house_number].filter(Boolean).join(' ') }}
                    <template v-if="customerForm.zip_code || customerForm.city">
                      · {{ [customerForm.zip_code, customerForm.city].filter(Boolean).join(' ') }}
                    </template>
                    <template v-if="customerForm.country"> · {{ customerForm.country }}</template>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="border border-neutral-200 bg-white text-neutral-950">
        <div class="px-4 py-3 border-b border-neutral-100">
          <h3 class="font-semibold leading-none tracking-tight">Einstellungen</h3>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div class="space-y-1">
              <label class="text-xs font-medium text-neutral-600">Status</label>
              <select v-if="isEditing && isDraft" v-model="form.status"
                class="flex h-9 w-full items-center justify-between rounded-none border border-neutral-200 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-950">
                <option value="DRAFT">Entwurf</option>
                <option value="SENT">Versendet</option>
                <option value="PAID">Bezahlt</option>
                <option value="OVERDUE">Überfällig</option>
              </select>
              <div v-else
                class="flex h-9 w-full items-center rounded-none border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">
                {{ getStatusLabel(invoice.status) }}
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-neutral-600">Rechnungsdatum</label>
              <input v-if="isEditing && isDraft" type="date" v-model="form.invoice_date"
                class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              <div v-else
                class="flex h-9 w-full items-center rounded-none border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-500">
                {{ formatDate(invoice.invoice_date || invoice.createdAt) }}
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-neutral-600">Fälligkeitsdatum</label>
              <input v-if="isEditing && isDraft" type="date" v-model="form.due_date"
                class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              <div v-else
                class="flex h-9 w-full items-center rounded-none border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-500">
                {{ formatDate(invoice.due_date) }}
              </div>
            </div>
            <div class="space-y-1">
              <label class="text-xs font-medium text-neutral-600">Tage</label>
              <input v-if="isEditing" type="number" min="0" v-model="form.days_to_pay"
                class="flex h-9 w-full rounded-none border border-neutral-200 bg-transparent px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950" />
              <div v-else
                class="flex h-9 w-full items-center rounded-none border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm text-neutral-500">
                {{ invoice.days_to_pay ?? form.days_to_pay }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border border-neutral-200 bg-white text-neutral-950 ">
        <div class="flex items-center justify-between p-6 pb-4 border-b border-neutral-100">
          <h3 class="font-semibold leading-none tracking-tight">Positionen</h3>
          <button v-if="isEditing && isDraft" @click="addItem"
              class="inline-flex h-8 items-center justify-center rounded-none border border-neutral-200 bg-white px-3 text-xs font-medium  transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Zeile hinzufügen
            </button>
          </div>

          <div class="w-full">
            <table class="w-full caption-bottom text-sm">
              <thead class="[&_tr]:border-b border-neutral-200">
                <tr class="border-b border-neutral-200 transition-colors hover:bg-neutral-100/50 data-[state=selected]:bg-neutral-100">
                  <th class="h-10 pl-4 pr-1 text-left align-middle font-medium text-neutral-500 w-[35%]">Beschreibung</th>
                  <th class="h-10 px-1 text-right align-middle font-medium text-neutral-500 w-[10%]">Menge</th>
                  <th class="h-10 px-1 text-left align-middle font-medium text-neutral-500 w-[12%]">Einheit</th>
                  <th class="h-10 px-1 text-right align-middle font-medium text-neutral-500 w-[12%]">Preis (€)</th>
                  <th class="h-10 px-1 text-right align-middle font-medium text-neutral-500 w-[14%]">Rabatt</th>
                  <th class="h-10 px-1 text-right align-middle font-medium text-neutral-500 w-[12%]">MwSt.</th>
                  <th class="h-10 pl-1 pr-4 text-right align-middle font-medium text-neutral-500 w-[14%]">Gesamt</th>
                  <th v-if="isEditing && isDraft" class="h-10 px-2 align-middle w-[5%]"></th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                <template v-for="(item, index) in form.items" :key="index">
                  <tr class="border-b border-neutral-200 transition-colors hover:bg-neutral-50/50 group">
                    <td class="pl-4 pr-1 py-2 align-middle relative">
                      <div v-if="isEditing && isDraft" class="relative">
                        <input v-model="item.description" @focus="focusRow(index)" @blur="blurRow(index)"
                          class="flex h-9 w-full rounded-none border border-neutral-200 px-3 py-1 text-sm transition-colors placeholder:text-neutral-400 focus-visible:outline-none focus:border-neutral-300 focus:bg-white"
                          placeholder="Leistung eingeben..." />

                        <div v-if="focusedRowIndex === index && suggestions.length > 0"
                          class="absolute z-50 left-0 top-full mt-1 w-[300px] rounded-none border border-neutral-200 bg-white shadow-md outline-none"
                          @mousedown.prevent>
                          <div class="p-1 max-h-60 overflow-y-auto">
                            <div v-for="sugg in suggestions" :key="sugg.id" @click="applySuggestion(index, sugg)"
                              class="relative flex cursor-pointer select-none items-center justify-between  px-2 py-1.5 text-sm outline-none hover:bg-neutral-100 hover:text-neutral-900">
                              <div class="flex flex-col">
                                <span class="font-medium">{{ sugg.label }}</span>
                                <span class="text-[10px] text-neutral-500 uppercase">{{ sugg.type }}</span>
                              </div>
                              <span class="font-medium text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded">{{
                                formatMoney(sugg.price) }} €</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <span v-else class="font-medium text-neutral-900 block">{{ item.description }}</span>
                    </td>

                    <td class="p-1 align-middle text-right">
                      <input v-if="isEditing && isDraft" type="number" v-model="item.quantity" min="1"
                        class="flex h-9 w-full text-right rounded-none border border-neutral-200 px-3 py-1 text-sm focus-visible:outline-none focus:border-neutral-300 focus:bg-white" />
                      <span v-else class="text-neutral-600 block">{{ item.quantity }}</span>
                    </td>

                    <td class="p-1 align-middle text-left">
                      <input v-if="isEditing && isDraft" type="text" v-model="item.unit"
                        class="flex h-9 w-full rounded-none border border-neutral-200 px-3 py-1 text-sm text-neutral-500 focus-visible:outline-none focus:border-neutral-300 focus:bg-white"
                        placeholder="Einheit" name="suggestions" list="suggestions" />
                      <span v-else class="text-neutral-500 block">{{ item.unit || '-' }}</span>
                    </td>

                    <td class="p-1 align-middle text-right">
                      <input v-if="isEditing && isDraft" type="number" v-model="item.amount" step="0.01"
                        class="flex h-9 w-full text-right rounded-none border border-neutral-200 px-3 py-1 text-sm focus-visible:outline-none focus:border-neutral-300 focus:bg-white"
                        placeholder="0.00" />
                      <span v-else class="text-neutral-900 block">{{ formatMoney(item.amount) }} €</span>
                    </td>

                    <td class="p-1 align-middle text-right">
                      <div v-if="isEditing && isDraft" class="flex h-9 w-full border border-neutral-200 focus-within:border-neutral-300">
                        <input type="number" min="0" step="0.01"
                          :value="discountDisplayValue(item)"
                          @input="onDiscountInput(item, $event)"
                          class="min-w-0 flex-1 bg-transparent px-2 py-1 text-right text-sm focus-visible:outline-none"
                          placeholder="0" />
                        <select :value="item.discount_type"
                          @change="onDiscountTypeChange(item, $event)"
                          class="w-10 shrink-0 border-l border-neutral-200 bg-transparent text-xs text-neutral-600 focus:outline-none">
                          <option value="percent">%</option>
                          <option value="amount">€</option>
                        </select>
                      </div>
                      <span v-else class="text-neutral-600 block">{{ formatDiscountLabel(item) }}</span>
                    </td>

                    <td class="p-1 align-middle text-right">
                      <select v-if="isEditing && isDraft" v-model="item.vat_rate"
                        class="flex h-9 w-full items-center justify-between rounded-none border border-neutral-200 px-3 py-1 text-sm  focus:outline-none focus:ring-1 focus:ring-neutral-950">
                        <option :value="0">0%</option>
                        <option :value="0.07">7%</option>
                        <option :value="0.19">19%</option>
                      </select>
                      <span v-else class="text-neutral-600 block">{{ formatVatPercent(parseVatRateFromApi(item.vat_rate))
                        }}%</span>
                    </td>

                    <td class="pl-1 pr-4 align-middle text-right font-medium">
                      {{ formatMoney(lineItemNet(item)) }} €
                    </td>

                    <td v-if="isEditing && isDraft" class="p-4 align-middle text-center relative">
                      <button @click="removeItem(index)"
                        class="inline-flex h-8 w-8 items-center justify-center rounded-none text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Löschen">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>

                  <tr v-if="(isEditing && isDraft) || item.long_description"
                    class="border-b border-neutral-100 transition-colors hover:bg-neutral-50/50">
                    <td :colspan="(isEditing && isDraft) ? 8 : 7" class="px-4 pb-1 pt-0">
                      <div>
                        <textarea v-if="isEditing && isDraft" v-model="item.long_description"
                          placeholder="Zusätzliche Beschreibung (optional)..."
                          class="w-full rounded-none border border-neutral-200 bg-white/50 p-2 text-sm text-neutral-600 focus-visible:outline-none focus:border-neutral-300 focus:bg-white transition-all"
                          rows="2"></textarea>
                        <p v-else-if="item.long_description"
                          class="text-xs text-neutral-500 whitespace-pre-wrap leading-relaxed">
                          {{ item.long_description }}
                        </p>
                      </div>
                    </td>
                  </tr>
                </template>

                <tr v-if="isEditing && isDraft && form.items.length === 0">
                  <td colspan="8" class="p-8 text-center text-sm text-neutral-500">
                    Keine Positionen vorhanden. <button @click="addItem"
                      class="text-neutral-900 font-medium hover:underline">Erste Zeile hinzufügen</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="border-t border-neutral-200 bg-neutral-50 p-4 pb-6">
            <div class="flex justify-end">
              <div class="w-full max-w-md space-y-2">
                <div class="flex justify-between text-sm text-neutral-500">
                  <span>Netto</span>
                  <span class="font-medium text-neutral-900">{{ formatMoney(totals.net) }} €</span>
                </div>
                <div v-for="row in totals.taxByRate" :key="row.rate"
                  class="flex justify-between gap-3 text-sm text-neutral-500">
                  <span class="text-left leading-snug">Umsatzsteuer {{ formatVatPercent(row.rate) }}% (aus {{
                    formatMoney(row.net) }} € netto)</span>
                  <span class="font-medium text-neutral-900 shrink-0">{{ formatMoney(row.amount) }} €</span>
                </div>
                <div class="flex justify-between pt-2 border-t border-neutral-200 mt-2 font-semibold text-base">
                  <span>Gesamtbetrag</span>
                  <span>{{ formatMoney(totals.gross) }} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  </div>

  <!-- Email send dialog with PDF preview -->
  <Teleport to="body">
    <div
      v-if="showEmailPreview"
      class="dialog-overlay z-[100]"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0" @click="closeEmailPreview" />
      <div class="dialog-panel max-w-3xl">
        <div class="dialog-header">
          <div class="min-w-0 flex-1">
            <h3 class="dialog-title">Rechnung per E-Mail senden</h3>
            <p class="dialog-desc">
              Vorschau der PDF-Rechnung vor dem Versand an
              <strong class="text-neutral-900">{{ emailRecipientLabel }}</strong>
            </p>
          </div>
          <button
            type="button"
            class="dialog-close"
            aria-label="Schließen"
            @click="closeEmailPreview"
          >
            <UiIcon name="i-lucide-x" class="size-5" />
          </button>
        </div>

        <div class="dialog-body !py-4">
          <div
            v-if="emailPreviewLoading"
            class="flex min-h-[420px] flex-col items-center justify-center gap-3 text-sm text-neutral-500"
          >
            <svg class="h-8 w-8 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            PDF wird geladen…
          </div>
          <div
            v-else-if="emailPreviewError"
            class="flex min-h-[200px] items-center justify-center border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700"
          >
            {{ emailPreviewError }}
          </div>
          <iframe
            v-else-if="emailPreviewUrl"
            :src="emailPreviewUrl"
            title="Rechnungsvorschau"
            class="h-[60vh] w-full border border-neutral-200 bg-neutral-50"
          />
        </div>

        <div class="dialog-footer">
          <button
            type="button"
            class="btn-dialog-cancel"
            :disabled="emailSending"
            @click="closeEmailPreview"
          >
            Abbrechen
          </button>
          <button
            type="button"
            class="btn-dialog-primary"
            :disabled="emailSending || emailPreviewLoading || !!emailPreviewError"
            @click="confirmSendInvoiceEmail"
          >
            <span
              v-if="emailSending"
              class="mr-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            {{ emailSending ? "Wird gesendet…" : "Jetzt senden" }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  emptyInvoiceLineItem,
  mapApiLineItem,
  lineItemNet,
  discountDisplayValue,
  onDiscountInput,
  onDiscountTypeChange,
  formatDiscountLabel,
  type InvoiceLineItemForm,
} from "~/utils/invoiceLineItem";

const route = useRoute();
const router = useRouter();

// Fix Nuxt auto-import issues by asserting useBookingApi exists.
// In Nuxt this is auto-imported, so we'll just use it directly.
const api = useBookingApi();
const { confirm } = useConfirm();

const loading = ref(true);
const saving = ref(false);
const isEditing = ref(false);
const invoice = ref<any>(null);

const isDraft = computed(() => invoice.value?.status === "DRAFT");
const isStorno = computed(() => invoice.value?.status === "DELETED");
const hasDraftNumber = computed(
  () =>
    !invoice.value?.invoice_number ||
    invoice.value.invoice_number.startsWith("DRAFT"),
);
const canDeleteInvoice = computed(() => hasDraftNumber.value);
const canStornoInvoice = computed(
  () => !hasDraftNumber.value && invoice.value?.status !== "DELETED",
);
const isLockedAfterSend = computed(() =>
  ["SENT", "PAID", "OVERDUE"].includes(invoice.value?.status),
);

const form = ref({
  status: "DRAFT",
  notes: "",
  invoice_date: "",
  due_date: "",
  days_to_pay: 7,
  user_id: null as number | null,
  user_preview: null as any,
  items: [] as InvoiceLineItemForm[],
});

const customerForm = ref({
  first_name: "",
  last_name: "",
  company: "",
  email: "",
  street: "",
  house_number: "",
  phone: "",
  zip_code: "",
  city: "",
  country: "",
  user_type: "PERSON" as "PERSON" | "COMPANY",
  display_contact_person: false,
});

const fillCustomerFormFromInvoice = (data: any) => {
  if (
    data.recipient_first_name ||
    data.recipient_last_name ||
    data.recipient_company ||
    data.recipient_street
  ) {
    customerForm.value = {
      first_name: data.recipient_first_name || "",
      last_name: data.recipient_last_name || "",
      company: data.recipient_company || "",
      email: data.recipient_email || data.User?.email || "",
      street: data.recipient_street || "",
      house_number: data.recipient_house_number || "",
      phone: data.recipient_phone || "",
      zip_code: data.recipient_zip_code || "",
      city: data.recipient_city || "",
      country: data.recipient_country || "",
      user_type: (data.recipient_user_type === "COMPANY" ? "COMPANY" : "PERSON") as
        | "PERSON"
        | "COMPANY",
      display_contact_person: Boolean(data.recipient_display_contact_person),
    };
    return;
  }

  const d = data.User?.details || {};
  customerForm.value = {
    first_name: d.first_name || "",
    last_name: d.last_name || "",
    company: d.company || "",
    email: data.User?.email || "",
    street: d.street || "",
    house_number: d.house_number || "",
    phone: d.mobile_number || "",
    zip_code: d.zip_code || "",
    city: d.city || "",
    country: d.country || "",
    user_type: (d.user_type === "COMPANY" ? "COMPANY" : "PERSON") as
      | "PERSON"
      | "COMPANY",
    display_contact_person: Boolean(d.display_contact_person),
  };
};

const fillCustomerFormFromUser = (user: any) => {
  const d = user?.details || {};
  customerForm.value = {
    first_name: d.first_name || "",
    last_name: d.last_name || "",
    company: d.company || "",
    email: user?.email || "",
    street: d.street || "",
    house_number: d.house_number || "",
    phone: d.mobile_number || "",
    zip_code: d.zip_code || "",
    city: d.city || "",
    country: d.country || "",
    user_type: (d.user_type === "COMPANY" ? "COMPANY" : "PERSON") as
      | "PERSON"
      | "COMPANY",
    display_contact_person: Boolean(d.display_contact_person),
  };
};

const buildRecipientPayload = () => ({
  user_type: customerForm.value.user_type,
  first_name: customerForm.value.first_name,
  last_name: customerForm.value.last_name,
  company: customerForm.value.company,
  email: customerForm.value.email,
  phone: customerForm.value.phone,
  street: customerForm.value.street,
  house_number: customerForm.value.house_number,
  zip_code: customerForm.value.zip_code,
  city: customerForm.value.city,
  country: customerForm.value.country,
  display_contact_person: customerForm.value.display_contact_person,
});

const invoiceId = route.params.id as string;

// Data for autocomplete
const resources = ref<any[]>([]);
const services = ref<any[]>([]);
const allPricing = ref<any[]>([]);

// Autocomplete state
const focusedRowIndex = ref<number | null>(null);

// Search State
const userSearchQuery = ref("");
const userSearchResults = ref<any[]>([]);
const isSearchingUsers = ref(false);
let searchTimeout: ReturnType<typeof setTimeout> | null = null;

const formatMoney = (val: any) => Number(val || 0).toFixed(2);

const parseDateInput = (value: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateInput = (date: Date) => date.toISOString().split("T")[0];

const calculateDueDateFromDays = (invoiceDate: string, daysToPay: number) => {
  const baseDate = parseDateInput(invoiceDate);
  if (!baseDate) return "";
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + Number(daysToPay || 0));
  return formatDateInput(nextDate);
};

const calculateDaysBetweenDates = (fromDate: string, toDate: string) => {
  const from = parseDateInput(fromDate);
  const to = parseDateInput(toDate);
  if (!from || !to) return null;
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcFrom = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const utcTo = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((utcTo - utcFrom) / msPerDay);
};

const syncingPaymentTerms = ref(false);

const parseVatRateFromApi = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return 0.19;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0.19;
};

const formatVatPercent = (rate: number) => {
  const p = Math.round(rate * 10000) / 100;
  return Number.isInteger(p) ? String(p) : String(p);
};

const getStatusLabel = (s: string) =>
  ({
    DELETED: "Storniert",
    DRAFT: "Entwurf",
    SENT: "Versendet",
    PAID: "Bezahlt",
    PARTIALLY_PAID: "Teilweise bezahlt",
    OVERDUE: "Überfällig",
  })[s] || s;

const getStatusClass = (s: string) =>
  ({
    PAID: "border-emerald-200 bg-emerald-100 text-emerald-800",
    PARTIALLY_PAID: "border-purple-200 bg-purple-100 text-purple-800",
    SENT: "border-blue-200 bg-blue-100 text-blue-800",
    OVERDUE: "border-red-200 bg-red-100 text-red-800",
    DELETED: "border-neutral-200 bg-neutral-100 text-neutral-800",
    DRAFT: "border-neutral-200 bg-neutral-100 text-neutral-800",
  })[s] || "border-neutral-200 bg-neutral-100 text-neutral-800";

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("de-DE");
};

watch(
  () => [form.value.invoice_date, form.value.days_to_pay],
  ([newInvoiceDate, newDays]) => {
    if (syncingPaymentTerms.value || !isEditing.value || !newInvoiceDate) return;
    syncingPaymentTerms.value = true;
    form.value.due_date = calculateDueDateFromDays(
      String(newInvoiceDate),
      Number(newDays || 0),
    );
    syncingPaymentTerms.value = false;
  },
);

watch(
  () => form.value.due_date,
  (newDueDate) => {
    if (syncingPaymentTerms.value || !isEditing.value || !form.value.invoice_date || !newDueDate) return;
    const days = calculateDaysBetweenDates(form.value.invoice_date, newDueDate);
    if (days === null) return;
    syncingPaymentTerms.value = true;
    form.value.days_to_pay = days;
    syncingPaymentTerms.value = false;
  },
);

// --- Computed Products for Autocomplete ---
const allProducts = computed(() => {
  const list: any[] = [];
  services.value.forEach((s) =>
    list.push({
      id: `svc-${s.id}`,
      label: s.name,
      price: s.price_per_unit,
      unit: s.pricing_unit,
      type: "Service",
    }),
  );
  resources.value.forEach((r) => {
    const plans = allPricing.value.filter((p) => p.resource_id === r.id);
    if (plans.length > 0) {
      plans.forEach((plan) =>
        list.push({
          id: `res-${r.id}-p-${plan.id}`,
          label: `${r.name} - ${plan.name}`,
          price: plan.price,
          type: "Raum",
          unit: plan.billing_interval,
        }),
      );
    } else {
      list.push({ id: `res-${r.id}`, label: r.name, price: 0, type: "Raum", unit: "Stunde" });
    }
  });
  return list;
});

const suggestions = computed(() => {
  if (focusedRowIndex.value === null || !isEditing.value || !isDraft.value) return [];
  const itemDesc = form.value.items[focusedRowIndex.value]?.description;
  const currentInput = itemDesc ? String(itemDesc).toLowerCase() : "";
  if (!currentInput) return allProducts.value;
  return allProducts.value
    .filter((p) => String(p.label).toLowerCase().includes(currentInput))
    .slice(0, 8);
});

// --- Computed Totals (Live Berechnung) ---
const totals = computed(() => {
  const taxByRateMap = new Map<number, { net: number; tax: number }>();
  let net = 0;
  for (const item of form.value.items) {
    const lineNet = lineItemNet(item);
    net += lineNet;
    const rate = parseVatRateFromApi(item.vat_rate);
    const key = Math.round(rate * 10000) / 10000;
    const prev = taxByRateMap.get(key) || { net: 0, tax: 0 };
    taxByRateMap.set(key, {
      net: prev.net + lineNet,
      tax: prev.tax + lineNet * rate,
    });
  }
  const taxByRate = [...taxByRateMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([rate, v]) => ({ rate, net: v.net, amount: v.tax }));
  const tax = taxByRate.reduce((s, r) => s + r.amount, 0);
  return {
    net,
    tax,
    taxByRate,
    gross: net + tax,
  };
});

// --- Data Loading ---
const loadInvoice = async () => {
  loading.value = true;
  try {
    // Load resources, services, and pricing for autocomplete
    const [r, s, p] = await Promise.all([
      api.resources.getAll(),
      api.services.getAll(),
      api.pricing.getAll(),
    ]);
    resources.value = (r as any[]) || [];
    services.value = (s as any[]) || [];
    allPricing.value = (p as any[]) || [];

    const data = await api.sales.getOne(invoiceId);
    if (data) {
      invoice.value = data;

      // Init Form Data
      form.value.status = data.status;
      form.value.notes = data.notes || "";
      form.value.invoice_date = data.invoice_date
        ? new Date(data.invoice_date).toISOString().split("T")[0]
        : data.createdAt
          ? new Date(data.createdAt).toISOString().split("T")[0]
          : "";
      form.value.due_date = data.due_date
        ? new Date(data.due_date).toISOString().split("T")[0]
        : "";
      const calculatedDays =
        form.value.invoice_date && form.value.due_date
          ? calculateDaysBetweenDates(form.value.invoice_date, form.value.due_date)
          : null;
      form.value.days_to_pay = Number.isFinite(Number(data.days_to_pay))
        ? Number(data.days_to_pay)
        : Number(calculatedDays ?? 0);

      form.value.user_id = data.user_id;
      form.value.user_preview = data.User;
      fillCustomerFormFromInvoice(data);

      // Map Items for Editing
      if (data.InvoiceLineItems && Array.isArray(data.InvoiceLineItems)) {
        form.value.items = data.InvoiceLineItems.map((i: any) => ({
          ...mapApiLineItem(i),
          vat_rate: parseVatRateFromApi(i.vat_rate),
        }));
      } else {
        form.value.items = [];
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// --- Actions ---

const toggleEditMode = () => {
  if (isEditing.value) {
    loadInvoice();
  } else {
    if (!isDraft.value) return;
  }
  isEditing.value = !isEditing.value;
};

// User Search Logic
const handleUserSearch = () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  if (!userSearchQuery.value || userSearchQuery.value.length < 2) {
    userSearchResults.value = [];
    return;
  }

  isSearchingUsers.value = true;
  searchTimeout = setTimeout(async () => {
    try {
      const users: any[] = await api.users.getAll();
      const q = userSearchQuery.value.toLowerCase();
      userSearchResults.value = users
        .filter(
          (u: any) =>
            u.username?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.details?.company?.toLowerCase().includes(q) ||
            u.details?.first_name?.toLowerCase().includes(q) ||
            u.details?.last_name?.toLowerCase().includes(q),
        )
        .slice(0, 5);
    } catch (e) {
      console.error(e);
    } finally {
      isSearchingUsers.value = false;
    }
  }, 300);
};

const selectUser = (user: any) => {
  form.value.user_id = user.id;
  form.value.user_preview = user;
  fillCustomerFormFromUser(user);
  userSearchQuery.value = "";
  userSearchResults.value = [];
};

const removeUser = () => {
  form.value.user_id = null;
  form.value.user_preview = null;
};

// Autocomplete functions
const focusRow = (index: number) => {
  focusedRowIndex.value = index;
};
const blurRow = (index: number) => {
  setTimeout(() => {
    if (focusedRowIndex.value === index) focusedRowIndex.value = null;
  }, 200);
};

const applySuggestion = (index: number, suggestion: any) => {
  const item = form.value.items[index];
  if (item) {
    item.description = suggestion.label;
    item.amount = suggestion.price;
    if (suggestion.unit) item.unit = translateUnit(suggestion.unit);
  }
  focusedRowIndex.value = null;
};



const translateUnit = (unit: string) => {
  switch (unit) {
    case "PER_HOUR":
      return "Stunde";
    case "HOUR":
      return "Stunde";
    case "DAY":
      return "Tag";
    case "WEEK":
      return "Woche";
    case "MONTH":
      return "Monat";
    case "YEAR":
      return "Jahr";
    case "ONE_OFF":
      return "Einmalig";
    case "LIFETIME":
      return "Lebenslang";
    case "PER_BOOKING":
      return "Pro Buchung";
    case "PER_DAY":
      return "Pro Tag";
    case "PER_WEEK":
      return "Pro Woche";
    case "PER_MONTH":
      return "Pro Monat";
    case "PER_YEAR":
      return "Pro Jahr";
    default:
      return unit;
  }
};

const addItem = () => {
  form.value.items.push(emptyInvoiceLineItem({ unit: "Stück" }));
};

const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};

const saveInvoice = async () => {
  saving.value = true;
  try {
    if (!form.value.items.length) {
      alert("Bitte mindestens eine Position anlegen.");
      saving.value = false;
      return;
    }
    const res: any = await api.sales.update(Number(invoiceId), {
      status: form.value.status,
      notes: form.value.notes,
      invoice_date: form.value.invoice_date,
      due_date: form.value.due_date,
      days_to_pay: Number(form.value.days_to_pay),
      user_id: form.value.user_id,
      items: form.value.items,
      recipient: buildRecipientPayload(),
    });

    if (res) {
      invoice.value = res; // Update view with server response
      fillCustomerFormFromInvoice(res);
      // Wichtig: Auch Form Items updaten, falls Server Daten formatiert hat
      if (res.InvoiceLineItems) {
        form.value.items = res.InvoiceLineItems.map((i: any) => ({
          ...mapApiLineItem(i),
          vat_rate: parseVatRateFromApi(i.vat_rate),
        }));
      }
      form.value.user_id = res.user_id;
      form.value.user_preview = res.User;
      isEditing.value = false;
    }
  } catch (e: any) {
    console.error(e);
    alert("Fehler beim Speichern: " + e.message);
  } finally {
    saving.value = false;
  }
};

const handleDownload = async () => {
  try {
    const blob = await api.sales.downloadInvoice(invoice.value.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rechnung_${invoice.value.invoice_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Download failed:", error);
    alert("Fehler beim Herunterladen der Rechnung.");
  }
};

const handleDelete = async () => {
  const confirmed = await confirm({
    title: "Rechnung löschen",
    message:
      "Sind Sie sicher, dass Sie diese Rechnung unwiderruflich löschen möchten?",
    variant: "danger",
    confirmLabel: "Ja, löschen",
  });
  if (!confirmed) return;

  try {
    await api.sales.delete(Number(invoiceId));
    router.push("/booking-system/invoices");
  } catch (e: any) {
    console.error(e);
    const message =
      e?.data?.error ||
      e?.message ||
      "Fehler beim Löschen.";
    alert(message);
  }
};

const showEmailPreview = ref(false);
const emailPreviewUrl = ref<string | null>(null);
const emailPreviewLoading = ref(false);
const emailPreviewError = ref("");
const emailSending = ref(false);

const emailRecipientLabel = computed(
  () =>
    invoice.value?.recipient_email ||
    invoice.value?.User?.email ||
    "den Kunden",
);

const revokeEmailPreviewUrl = () => {
  if (emailPreviewUrl.value) {
    window.URL.revokeObjectURL(emailPreviewUrl.value);
    emailPreviewUrl.value = null;
  }
};

const closeEmailPreview = () => {
  showEmailPreview.value = false;
  emailPreviewError.value = "";
  emailPreviewLoading.value = false;
  emailSending.value = false;
  revokeEmailPreviewUrl();
};

const openEmailPreview = async () => {
  if (!invoice.value?.id) return;
  showEmailPreview.value = true;
  emailPreviewError.value = "";
  emailPreviewLoading.value = true;
  revokeEmailPreviewUrl();

  try {
    const blob = await api.sales.downloadInvoice(invoice.value.id);
    emailPreviewUrl.value = window.URL.createObjectURL(blob);
  } catch (e) {
    console.error(e);
    emailPreviewError.value =
      "PDF-Vorschau konnte nicht geladen werden. Bitte später erneut versuchen.";
  } finally {
    emailPreviewLoading.value = false;
  }
};

const confirmSendInvoiceEmail = async () => {
  emailSending.value = true;
  try {
    const res = await api.sales.sendEmail(Number(invoiceId));
    if (!res) return;
    closeEmailPreview();
    alert("E-Mail wurde erfolgreich versendet.");
    await loadInvoice();
  } catch (e: any) {
    console.error(e);
    alert("Fehler beim Senden der E-Mail: " + (e.message || ""));
  } finally {
    emailSending.value = false;
  }
};

const sendInvoiceEmail = openEmailPreview;

const markInvoicePaid = async () => {
  try {
    await api.sales.update(Number(invoiceId), { status: "PAID" });
    await loadInvoice();
  } catch (e: any) {
    console.error(e);
    alert("Fehler: " + (e?.message || "Status konnte nicht gesetzt werden."));
  }
};

const stornoInvoice = async () => {
  const confirmed = await confirm({
    title: "Rechnung stornieren",
    message:
      "Diese Rechnung stornieren? Die Rechnungsnummer bleibt dauerhaft vergeben. Das archivierte PDF wird mit „STORNIERT“ gekennzeichnet.",
    variant: "warning",
    confirmLabel: "Ja, stornieren",
    icon: "i-heroicons-exclamation-triangle-20-solid",
  });
  if (!confirmed) return;

  try {
    await api.sales.update(Number(invoiceId), { status: "DELETED" });
    await loadInvoice();
  } catch (e: any) {
    console.error(e);
    alert("Fehler beim Stornieren: " + (e?.message || ""));
  }
};

onMounted(() => {
  loadInvoice();
});
</script>
