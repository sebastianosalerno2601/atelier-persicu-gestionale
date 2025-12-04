# Istruzioni per rimuovere ricorrenze in produzione

## ✅ Endpoint API creato (senza bisogno di Shell/abbonamento)

Dopo il deploy, puoi eseguire lo script chiamando l'endpoint API direttamente dal browser o da Postman.

## 📋 Come usarlo:

### Opzione 1: Da Browser (più semplice)

1. **Accedi all'applicazione** in produzione con il tuo account superadmin

2. **Apri la console del browser** (F12 → Console)

3. **Esegui questo codice JavaScript**:

```javascript
// Ottieni il token di autenticazione (è salvato separatamente)
const token = localStorage.getItem('atelier-auth-token');

if (!token) {
  alert('❌ Errore: Non sei autenticato. Effettua il login prima di eseguire questo script.');
  console.error('Token non trovato. Assicurati di essere loggato.');
} else {
  // Chiama l'endpoint (SOSTITUISCI L'URL!)
  fetch('https://atelier-persicu-gestionale.onrender.com/api/admin/remove-recurrences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Risultato completo:', data);
    alert(`✅ Ricorrenze rimosse!\nMantenuti: ${data.summary.kept}\nEliminati: ${data.summary.deleted}\nAggiornati: ${data.summary.updated}`);
  })
  .catch(error => {
    console.error('❌ Errore:', error);
    alert('❌ Errore: ' + error.message);
  });
}
```

**⚠️ IMPORTANTE**: Sostituisci `https://tuo-sito-render.onrender.com` con l'URL reale del tuo sito in produzione!

### Opzione 2: Da Postman (più visuale)

1. **Apri Postman** (o qualsiasi client API)

2. **Crea una nuova richiesta POST**:
   - URL: `https://atelier-persicu-gestionale.onrender.com/api/admin/remove-recurrences`
   - Metodo: `POST`
   - Headers:
     - `Content-Type: application/json`
     - `Authorization: Bearer TUO_TOKEN_JWT`
   
 3. **Per ottenere il token JWT**:
    - Accedi all'app in produzione
    - Apri la console del browser (F12)
    - Esegui: `localStorage.getItem('atelier-auth-token')`
    - Copia il token (senza le virgolette) e usalo nell'header Authorization come: `Bearer [TUO_TOKEN]`

4. **Invia la richiesta** e vedrai il risultato con tutti i dettagli

## 🔒 Sicurezza

- Solo il superadmin può chiamare questo endpoint
- Richiede autenticazione JWT valida
- Verifica automaticamente il ruolo dell'utente

## 📊 Risultato

Riceverai una risposta JSON con:
- `success`: true/false
- `message`: Messaggio di riepilogo
- `summary`: Statistiche (mantenuti, eliminati, aggiornati)
- `results`: Dettagli completi di tutte le operazioni

## ⚠️ Dopo l'uso

**IMPORTANTE**: Ricorda di rimuovere l'endpoint `/api/admin/remove-recurrences` dopo averlo usato per sicurezza!
- File da rimuovere/modificare: `server/routes/admin.js`
- Rimuovi la route da `server/server.js` se non serve più

