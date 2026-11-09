import { useState } from 'react';
import { Link } from 'react-router';

export default function BookingForm({ facility, user, authStatus, clearUser }) {
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
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: facility.id,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        })
      });
      const data = await response.json();
      if (response.status === 401) {
        clearUser();
        return;
      }
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

  if (authStatus === 'loading') return <p role="status">Verifica dell’accesso in corso…</p>;
  if (!user) return <p><Link to="/account">Accedi o registrati per prenotare.</Link></p>;
  if (facility.active === 0) return <p>Questo impianto è inattivo.</p>;

  return (
    <section aria-labelledby="booking-title">
      <h2 id="booking-title">Prenota l’impianto</h2>
      <p>{facility.capacity > 1 ? `Riservi un posto. Capienza: ${facility.capacity} posti.` : "Riservi l’intero impianto."} Gli orari sono quelli locali del tuo dispositivo.</p>
      <form onSubmit={book}>
        <fieldset disabled={sending}>
          <legend>Dati della prenotazione</legend>
          <p>Prenoti come {user.displayName}.</p>
          <p><label>Inizio <input name="startTime" type="datetime-local" required /></label></p>
          <p><label>Fine <input name="endTime" type="datetime-local" required /></label></p>
          <button className="button button-primary" type="submit">{sending ? 'Invio in corso…' : 'Prenota'}</button>
        </fieldset>
      </form>
      <p role="status">{message}</p>
    </section>
  );
}
