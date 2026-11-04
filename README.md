# SportHub

>  **Nota importante:** Questo progetto è stato realizzato interamente in solitaria a seguito del completo abbandono da parte degli altri membri del gruppo. Dato che conosco JavaScript a mala pena e che il codice è stato scritto con il supporto massiccio di LLM, chiedo scusa per lo scarso tocco personale e se la qualità complessiva ne risente. Ho fatto del mio meglio per riuscire a portarlo a termine da sol*.

SportHub è una web application iniziale per un progetto didattico di ingegneria del software. In questa versione puoi vedere gli impianti di un centro sportivo, aprirne il dettaglio con la durata minima e prenotare un intervallo futuro: l’intero campo da calcio/tennis oppure un posto in piscina/palestra. Le prenotazioni seguono la specifica della Lezione 4 e l’evoluzione per posti della Lezione 11. Lezioni 5 e 6 non disponibili, quindi ignorate.

## Requisiti e installazione

Serve Node.js 20.19+ (serie 20), 22 o 24. Dalla directory principale del progetto:

```bash
npm install
```

Per usare la configurazione locale di esempio, copia il template in `.env`:

```bash
cp .env_template .env
```

Il file `.env` è ignorato da Git; `.env_template` resta nel progetto come esempio. Al momento contiene solo `PORT=3000`. Lo script di avvio legge `.env` quando è presente e usa la porta 3000 anche se il file manca. Non inserire credenziali reali nel template.

Avvia il backend nel primo terminale:

```bash
npm run start:backend
```

Al primo avvio viene creato automaticamente `database/sporthub.db` con quattro impianti. Il backend risponde su <http://localhost:3000>.

Avvia il frontend in un secondo terminale:

```bash
npm run start:frontend
```

Apri <http://localhost:8080> nel browser. Vite aggiorna la pagina durante le modifiche al frontend.

Il frontend è una SPA con React Router e un unico documento `frontend/index.html`. Le route sono dichiarate in `frontend/src/App.jsx`: `/` mostra gli impianti, `/facilities/:id` il dettaglio e le altre URL una pagina non trovata. I componenti usano `Link` per navigare senza ricaricare il documento e `useParams` per leggere l'ID dell'impianto. Per aggiungere una pagina basta creare il componente e aggiungere una `Route` in `App.jsx`.

## API e database

- `GET /facilities` restituisce l'elenco degli impianti.
- `GET /facilities/:id` restituisce un impianto; un ID inesistente restituisce HTTP 404.
- `POST /bookings` salva una prenotazione con `facilityId`, `customerName`, `startTime`, `endTime`. Il dettaglio dell’impianto contiene il form. [Contratto e regole](docs/prenotazioni.md).

Il flusso è: componente React → `fetch` → backend Express → query SQLite → JSON → componente React. `backend/app.js` collega controller (HTTP), service (regole) e repository (query SQLite). Le tabelle e i dati iniziali sono definiti in `database/setup.js`.

Per riportare il database ai quattro impianti iniziali, ferma il backend e lancia:

```bash
npm run db:reset
```

**Attenzione:** il comando elimina tutte le prenotazioni e tutti gli impianti, poi ricrea i quattro impianti iniziali. Non usarlo per aggiornare un database di cui vuoi conservare i dati.

## Test e build

```bash
npm test
npm run build:frontend
```

I test in `tests/` usano un database SQLite in memoria e non modificano `database/sporthub.db`. La build crea la cartella `dist/`.

## Struttura

- `frontend/`: unico documento HTML, CSS e componenti React. `App.jsx` contiene le route e il layout condiviso; `FacilityCard.jsx` contiene la card dell'elenco.
- `vite.config.mjs`: server di sviluppo e build della SPA.
- `backend/`: server Express e route API.
- `database/`: inizializzazione SQLite, reset e database locale generato all'avvio.
- `tests/`: test automatici delle route.

## Materiali e incremento corrente

- [Consegne certe, ambiguità ed esempi esclusi](docs/consegne.md).
- [Lezione 3: impatto, criteri, API, ERD e flusso](docs/lezione03.md).
- [Lezione 4: specifica delle prenotazioni](docs/lezione04.md).
- [Prenotazioni: primo incremento, API e verifiche](docs/prenotazioni.md).
- [Lezione 11: prenotazioni per posti e struttura del backend](docs/lezione11.md).

Piscina e palestra hanno 2 posti di esempio; calcio e tennis riservano l’intero impianto. Le capacità non sono indicate nei materiali. Ogni prenotazione, anche preesistente, conta un posto negli impianti condivisi.

Il setup aggiorna anche la vecchia tabella degli impianti senza cancellare i dati. Per gli impianti personalizzati preesistenti la durata iniziale è 60 minuti.
