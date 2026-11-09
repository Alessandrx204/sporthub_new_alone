import { useEffect, useState } from 'react';
import { Link } from 'react-router';

export default function AccountPage({ user, authStatus, loadUser, clearUser }) {
  const [registering, setRegistering] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { document.title = 'Account | SportHub'; }, []);

  async function submit(event) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const body = { email: fields.get('email'), password: fields.get('password') };
    if (registering) body.displayName = fields.get('displayName');
    setSending(true);
    setMessage('');
    try {
      const response = await fetch(`http://localhost:3000/auth/${registering ? 'register' : 'login'}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error || 'Operazione non riuscita.');
        return;
      }
      if (registering) {
        setRegistering(false);
        form.reset();
        setMessage('Registrazione completata. Ora accedi.');
      } else {
        await loadUser();
      }
    } catch {
      setMessage('Non riusciamo a contattare il server. Riprova.');
    } finally {
      setSending(false);
    }
  }

  async function logout() {
    setSending(true);
    setMessage('');
    try {
      const response = await fetch('http://localhost:3000/auth/logout', {
        method: 'POST', credentials: 'include'
      });
      if (!response.ok) throw new Error();
      clearUser();
    } catch {
      setMessage('Uscita non riuscita. Riprova.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="section">
      <div className="container">
        <h1>{user ? 'Account' : registering ? 'Registrati' : 'Accedi'}</h1>
        {authStatus === 'loading' ? <p role="status">Verifica dell’accesso in corso…</p> : user ? (
          <>
            <p>Ciao, {user.displayName}.</p>
            <p><Link to="/">Vai agli impianti</Link> · <Link to="/bookings">Le mie prenotazioni</Link></p>
            <button className="button button-secondary" disabled={sending} onClick={logout}>Esci</button>
          </>
        ) : (
          <>
            {authStatus === 'error' && <p>Verifica dell’accesso non riuscita. Puoi riprovare accedendo.</p>}
            <form onSubmit={submit}>
              <fieldset disabled={sending}>
                <legend>{registering ? 'Nuovo account' : 'Credenziali'}</legend>
                {registering && <p><label>Nome <input name="displayName" autoComplete="name" required /></label></p>}
                <p><label>Email <input name="email" type="email" autoComplete="email" required /></label></p>
                <p><label>Password <input name="password" type="password" autoComplete={registering ? 'new-password' : 'current-password'} required /></label></p>
                <button className="button button-primary" type="submit">{sending ? 'Invio in corso…' : registering ? 'Registrati' : 'Accedi'}</button>
              </fieldset>
            </form>
            <p><button type="button" className="button button-secondary" disabled={sending} onClick={() => {
              setRegistering(!registering);
              setMessage('');
            }}>{registering ? 'Hai già un account? Accedi' : 'Crea un account'}</button></p>
          </>
        )}
        <p role="status">{message}</p>
      </div>
    </main>
  );
}
