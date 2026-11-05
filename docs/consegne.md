# Consegne ricavate dai materiali

I riferimenti sono pagine del PDF, non numeri stampati sulle slide. I materiali disponibili non comprendono L5, L6, L8, L9, L12, L13, L15 né il template citato in L4. Non si possono ricostruire eventuali richieste mancanti.

## Requisiti espliciti per SportHub

- L3, pp. 3, 6-12: salvare la durata minima, restituirla come `minBookingDurationMinutes`, mostrarla nel dettaglio, aggiornare test, ERD e API reference. Valori: Campo Centrale 90, Palestra Nord 60, Campo Tennis 60, Piscina Coperta 30 minuti.
- L4, pp. 20-21: compilare una specifica funzionale per «L’utente deve poter prenotare un impianto»: story, decisioni, criteri, test, sequenza, ERD e impatto. La lezione successiva prevede l’implementazione.
- L11, p. 14: Controller / Service / Repository, atomicità dove necessaria e prenotazione di un posto per alcuni impianti, dell’intero impianto per altri.
- L14, pp. 10-19: completare il runner, migrazione `001_add_facility_active.sql`, storico e transaction, conservazione di impianti e prenotazioni, seconda esecuzione SKIP, rifiuto delle nuove prenotazioni per impianti inattivi e consultazione delle storiche.
- L16, pp. 12-35: backend di registrazione e login con User, email normalizzata univoca, Argon2id, JWT HS256 valido un’ora nel cookie HttpOnly. Migrazione users senza perdita dati; validazione e status 201/400/409 per registrazione, 200/400/401 per login. Segreto in ambiente. Verificare registrazione, duplicato, login corretto e credenziali errate. Nessuna interfaccia React richiesta per questa lezione.
- L1, p. 5: alle tappe presentare software, test e decisioni documentate; non sono indicate date nei materiali forniti.

## Ambiguità da esplicitare quando si affronta la lezione

- Prenotazioni: durata/forma degli slot, orari, capacità effettive, sovrapposizioni, cancellazione e dati richiesti non sono specificati integralmente nei documenti disponibili. L7 e L16 mostrano `facilityId`, `customerName`, `startTime`, `endTime`, ma sono frammenti, non una specifica completa.
- Il badge indoor è ricordato in L3 come lavoro di L2, ma L2 fornita non contiene una consegna esplicita al riguardo.
- Il materiale DB di L14 contiene ancora solo la tabella iniziale facilities: è un supporto da adattare, non una baseline completa di prenotazioni e capacità.
- Per gli eventuali impianti aggiunti manualmente prima di L3 si assume durata minima di 60 minuti. I quattro impianti del corso ricevono i valori prescritti.

## Esempi e parti escluse

- Preferiti e chiusure temporanee in L4 sono esempi di specifica, non la consegna finale di SportHub.
- Equipment/Allocation in L7 è un esercizio separato di analisi dell’architettura.
- I quattro handler di L10/L11 (banca, bici, fatture, prodotti) richiedono ragionamento e codice per un esercizio separato: non aggiungere queste funzioni a SportHub.
- L14 p. 21 dichiara esplicitamente non obbligatoria la rinomina di capacity.
- L16 rinvia verifica JWT, protezione delle API, relazione Booking-User e /me alla lezione successiva. Conferma email e stato/soft delete degli account sono evoluzioni escluse dal laboratorio.
- L1 anticipa un servizio remoto e permessi, ma non ne specifica il contratto: nessuna integrazione da inventare.

## Avanzamento

L3 implementata e verificata. L4: specifica funzionale delle prenotazioni in [lezione04.md](lezione04.md), con decisioni locali dichiarate e test pianificati. Incremento successivo: prenotazioni implementate secondo la specifica L4 (vedi [prenotazioni.md](prenotazioni.md)); il materiale L5 non è disponibile e non se ne dichiara la conformità. L7 è stata letta come preparazione architetturale: l’esercizio separato Equipment/Allocation non è incluso nell’app. L11 implementata in [lezione11.md](lezione11.md), con capacità di esempio dichiarate. L14 e L16 implementate. Il README descrive migrazioni, registrazione e login. Lezioni 5 e 6 ignorate, come richiesto, perché non disponibili.
