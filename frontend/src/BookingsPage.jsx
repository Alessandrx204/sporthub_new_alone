import { useEffect, useState } from 'react';
import { Link } from 'react-router';

export default function BookingsPage({ user, authStatus, clearUser }) {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    document.title = 'Le mie prenotazioni | SportHub';
    if (!user) return;
    let cancelled = false;
    setStatus('loading');
    async function load() {
      try {
        const response = await fetch('http://localhost:3000/bookings', { credentials: 'include' });
        if (cancelled) return;
        if (response.status === 401) {
          clearUser();
          return;
        }
        if (!response.ok) throw new Error();
        const rows = await response.json();
        if (cancelled) return;
        setBookings(rows);
        setStatus('ready');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }
    load();
    return () => { cancelled = true; };
  }, [user]);

  return (
    <main className="section">
      <div className="container">
        <h1>Le mie prenotazioni</h1>
        {authStatus === 'loading' ? <p role="status">Verifica dell’accesso in corso…</p> : !user ? (
          <p><Link to="/account">Accedi per vedere le tue prenotazioni.</Link></p>
        ) : status === 'error' ? <p role="status">Impossibile caricare le prenotazioni. Riprova aprendo questa pagina.</p> : status === 'loading' ? (
          <p role="status">Caricamento in corso…</p>
        ) : bookings.length === 0 ? <p>Non hai ancora prenotazioni.</p> : (
          <ul>
            {bookings.map((booking) => (
              <li key={booking.id}>
                Prenotazione n. {booking.id} · <Link to={`/facilities/${booking.facilityId}`}>Impianto n. {booking.facilityId}</Link>
                {' · '}{new Date(booking.startTime).toLocaleString()} – {new Date(booking.endTime).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
