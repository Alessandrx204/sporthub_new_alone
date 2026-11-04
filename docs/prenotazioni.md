# Prenotazioni - Primo incremento funzionante

Implementa la specifica di [Lezione 4](lezione04.md). Il PDF della Lezione 5 non è fra i materiali disponibili: questo incremento non presume ulteriori consegne di quella lezione.

## Come provarle

1. Con Node 22, eseguire `npm install` se necessario, poi `npm run start:backend` e `npm run start:frontend` in due terminali.
2. Aprire un impianto da http://localhost:8080 e compilare Nome, Inizio e Fine.
3. Scegliere un intervallo futuro, almeno lungo quanto la durata minima mostrata.
4. Dopo l’invio, una conferma mostra ID, impianto e intervallo. Ripetere lo stesso intervallo: deve apparire un errore di indisponibilità.

Il nome è dichiarato dal cliente: non esistono ancora account. La prenotazione riguarda tutto l’impianto. Gli orari del form sono locali al dispositivo; vengono inviati e conservati come istanti UTC. Nessun calendario, elenco delle prenotazioni, modifica, cancellazione o capacità per posti è stato aggiunto.

## API

`POST /bookings`, Content-Type `application/json`:

```json
{
  "facilityId": 1,
  "customerName": "Mario",
  "startTime": "2030-11-10T09:00:00Z",
  "endTime": "2030-11-10T10:30:00Z"
}
```

Le date di esempio vanno sostituite se non sono più future. L’API richiede timestamp con secondi e fuso esplicito (`Z` oppure offset come `+01:00`); accetta anche millisecondi. Non accetta date impossibili come il 30 febbraio.

- 201: oggetto con `id`, `facilityId`, `customerName` senza spazi iniziali/finali, `startTime` e `endTime` normalizzati in UTC.
- 400: input non valido, inizio non futuro, fine non successiva all’inizio, durata insufficiente o JSON malformato.
- 404: impianto inesistente.
- 409: intervallo sovrapposto a una prenotazione dello stesso impianto.
- 500: errore inatteso di salvataggio, senza dettagli SQL nella risposta.

Gli errori sono oggetti `{ "error": "messaggio" }`. Gli intervalli adiacenti sono ammessi. La durata deve raggiungere il minimo, ma non deve esserne un multiplo. Le GET degli impianti conservano il contratto della Lezione 3.

## Database e atomicità

Il setup aggiunge `bookings` senza cancellare le righe esistenti di `facilities`. Campi e relazione sono quelli dell’ERD della specifica L4: `id`, `facility_id`, `customer_name`, `start_time`, `end_time`. La foreign key è abilitata sulle connessioni inizializzate.

In `backend/app.js`, controllo di disponibilità e INSERT sono racchiusi in una transaction `immediate`. Il lock di scrittura viene acquisito prima della lettura: una seconda connessione non può inserire una prenotazione fra controllo e salvataggio. Il lock resta limitato alla breve operazione sincrona, senza chiamate di rete. Un errore annulla l’inserimento.

Il controllo delle sovrapposizioni usa `start_time < nuovaFine AND end_time > nuovoInizio`. Tutte le date salvate dall’API sono nello stesso formato UTC, così i confronti sono coerenti. Non serve un contatore di disponibilità per la prenotazione dell’intero impianto.

Il reset ora elimina prima `bookings`, poi `facilities`, per rispettare la foreign key. È distruttivo: per un normale avvio usare gli script start, non il reset.

Il form è un piccolo componente aggiunto al dettaglio. Le regole restano nella route esistente; l’organizzazione Controller / Service / Repository sarà affrontata con la richiesta esplicita di L11.

## Verifiche eseguite

- `npm test` con Node 22: 13 test superati. Coprono le GET esistenti, aggiornamento del vecchio DB, successo alla durata minima, normalizzazione del fuso e nome, input mancanti/malformati, date impossibili, intervalli nulli/invertiti/passati, durata insufficiente, impianto inesistente, sovrapposizioni parziali/totali, adiacenze e impianti diversi.
- Due POST parallele incompatibili sullo stesso server: una 201 e una 409; una sola riga. Il test non è una prova di carico su più processi.
- Errore DB simulato con trigger dopo INSERT: risposta 500, rollback e nessuna riga parziale; l’API torna a funzionare rimosso il trigger.
- SQLite temporaneo su file: le prenotazioni restano dopo chiusura, riapertura e setup; FK inesistente rifiutata.
- JSON malformato e preflight CORS per il POST verificati.
- Comando di reset eseguito su una copia temporanea con una prenotazione: ripristina quattro impianti e zero prenotazioni.
- `npm run build:frontend`: riuscita; resta l’avviso già presente di React Router su `use client`.
- Browser su database solo in memoria: conferma con ID, rifiuto dell’intervallo occupato, nome obbligatorio vuoto e server irraggiungibile verificati. Il pulsante è disabilitato durante l’invio e non appare una falsa conferma se il server è irraggiungibile.

I test automatici usano database isolati. Le prenotazioni del browser di prova erano solo in memoria; non sono dati dell’utente.
