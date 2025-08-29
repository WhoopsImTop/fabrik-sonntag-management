Embed Widget — Anleitung

Dieses kleine Widget kann als eigenständige Seite innerhalb eines iframe eingebunden werden.

Pfad in diesem Projekt: `pages/embed/widget.vue` — diese Seite rendert die Komponente `components/embed/EmbedWidget.vue`.

Query-Parameter:
- `title` — Überschrift des Widgets
- `apiUrl` — wenn angegeben, wird das Formular per POST an diese URL gesendet
- `origin` — erlaubt die origin-Angabe für postMessage (defaults to `*`)

Beispiel Einbindung (extern):

```html
<iframe src="https://app.example.com/embed/widget?title=Anfrage&apiUrl=https%3A%2F%2Fapi.example.com%2Fcontact" style="width:385px;height:600px;border:0;" loading="lazy"></iframe>
```

Kommunikation zwischen Host und Widget:

- Host empfängt Formularsubmit (wenn `apiUrl` nicht gesetzt):

```js
window.addEventListener('message', (ev) => {
  if (!ev.data) return;
  if (ev.data.type === 'fs-embed-submit') {
    console.log('Payload', ev.data.payload);
    // ev.data.payload enthält das Formular
  }
  if (ev.data.type === 'fs-embed-height') {
    const h = ev.data.height;
    // anpassen der iframe Höhe
  }
});
```

Sicherheitshinweis: prüfe `ev.origin` bevor du Nachrichten verarbeitest.
