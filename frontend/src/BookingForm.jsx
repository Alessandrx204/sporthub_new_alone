import { useState } from 'react';

export default function BookingForm({ facility }) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  async function book(event) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const start = new Date(values.get('startTime'));
    const end = new Date(values.get('endTime'));
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      setMessage('Inserisci date valide.');
      return;
    }
    setSending(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:3000/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: facility.id,
          customerName: values.get('customerName'),
          startTime: start.toISOString(),
          endTime: end.toISOString()
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Prenotazione non riuscita.');
        return;
      }
      setMessage(`Prenotazione n. ${data.id} confermata per ${facility.name}, dal ${new Date(data.startTime).toLocaleString()} al ${new Date(data.endTime).toLocaleString()}.`);
      form.reset();
    } catch {
      setMessage('Non riusciamo a contattare il server. La prenotazione non è confermata.');
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-labelledby="booking-title">
      <h2 id="booking-title">Prenota l’impianto</h2>
      <p>Riservi l’intero impianto. Gli orari sono quelli locali del tuo dispositivo.</p>
      <form onSubmit={book}>
        <fieldset disabled={sending}>
          <legend>Dati della prenotazione</legend>
          <p><label>Nome <input name="customerName" required /></label></p>
          <p><label>Inizio <input name="startTime" type="datetime-local" required /></label></p>
          <p><label>Fine <input name="endTime" type="datetime-local" required /></label></p>
          <button className="button button-primary" type="submit">{sending ? 'Invio in corso…' : 'Prenota'}</button>
        </fieldset>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
