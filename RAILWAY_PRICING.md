# Railway: Come Funzionano i Crediti 💰

Railway usa un sistema di **crediti** invece di abbonamenti fissi. Hai **$5 di crediti gratuiti al mese** che si rinnovano automaticamente.

## 🎯 Come Si Consumano i Crediti

Railway addebita **al secondo** in base a:

### 1. **RAM (Memoria)**
- **Costo**: $0.00000386 per GB al secondo
- **Esempio**: Servizio con 512MB RAM 24/7 = ~$0.51/mese

### 2. **CPU (Processore)**
- **Costo**: $0.00000772 per vCPU al secondo
- **Esempio**: Servizio con 0.5 vCPU 24/7 = ~$0.28/mese

### 3. **Storage (Disco)**
- **Costo**: $0.00000006 per GB al secondo (praticamente gratuito)
- **Esempio**: 1GB di storage = ~$0.005/mese

### 4. **Traffico in Uscita (Egress)**
- **Costo**: $0.05 per GB di dati in uscita
- **Esempio**: 10GB/mese = $0.50

### 5. **Database MySQL**
- **Storage**: Incluso nel costo storage sopra
- **Connections**: Gratuite
- **Costo aggiuntivo**: Solo lo storage che usa

**Esempio Reale:**
Un servizio Node.js con:
- 512MB RAM + 0.5 vCPU per 1 ora:
  - RAM: $0.00000386 × 0.5GB × 3600s = $0.0069
  - CPU: $0.00000772 × 0.5 vCPU × 3600s = $0.0139
  - **Totale/ora: ~$0.02**
  - **Totale/mese (24/7): ~$0.80**

## 📊 Esempio di Costi per il Tuo Progetto

### Setup Tipico di Atelier Persicu:

1. **Server Node.js** (512MB RAM, 0.5 vCPU, sempre acceso):
   - RAM: ~$0.51/mese
   - CPU: ~$0.28/mese
   - **Totale server: ~$0.79/mese**

2. **Database MySQL** (500MB storage):
   - Storage: ~$0.002/mese (quasi gratis)

3. **Traffico Egress** (10GB/mese):
   - ~$0.50/mese

4. **File Statici React** (build ~20MB):
   - Storage: ~$0.0001/mese (praticamente gratis)

**Totale Stimato: ~$1.30/mese**

**Con $5 di crediti gratuiti:**
- ✅ Hai **$3.70 di margine**
- ✅ Sufficiente per traffico moderato (~100GB/mese)
- ✅ Puoi gestire servizi più potenti (1GB RAM, 1 vCPU)
- ✅ O molto più traffico

## 🚦 Quando Potresti Superare i $5 Gratuiti

### Scenario 1: Molto Traffico (Egress)
- **>100GB di egress/mese** = >$5 solo per traffico
- Tipico per siti con migliaia di visitatori/giorno
- **Per te**: Un gestionale per atelier probabilmente farà <20GB/mese

### Scenario 2: Server Più Potente
- **2GB RAM + 1 vCPU** = ~$1.60/mese solo per il server
- Più servizi attivi = costo moltiplicato
- **Per te**: 512MB RAM è più che sufficiente

### Scenario 3: Database Molto Grande
- Storage costa poco (~$0.005/GB/mese)
- Ma richiede più RAM/CPU se molto grande
- **Per te**: Database <1GB è più che sufficiente

### Scenario 4: Più Servizi Attivi
- Ogni servizio aggiuntivo costa separatamente
- **Per te**: Un solo servizio è sufficiente (backend + frontend insieme)

## 💡 Consigli per Risparmiare Crediti

### ✅ Best Practices (Quello che già fai):

1. **Un solo servizio** - Backend che serve anche React (✅ già configurato)
2. **Database MySQL ottimizzato** - Solo tabelle necessarie
3. **Build ottimizzata React** - File compressi e minimizzati

### ⚡ Ottimizzazioni Aggiuntive:

1. **Dormancy (Ibernazione)** - Railway può ibernare servizi dopo inattività (ma non per il tuo caso, meglio sempre acceso)

2. **Caching** - Riduce bandwidth:
   ```javascript
   // Nel server.js, aggiungi caching per file statici
   app.use(express.static(path.join(__dirname, '../build'), {
     maxAge: '1y' // Cache per 1 anno
   }));
   ```

3. **Database pulito** - Rimuovi record vecchi/non necessari periodicamente

## 📈 Monitoraggio dei Crediti

Nel dashboard Railway puoi vedere:
- **Crediti usati questo mese**
- **Proiezione mensile**
- **Breakdown per servizio**
- **Alert quando raggiungi l'80%**

## 🔄 Cosa Succede Quando Finiscono i Crediti?

1. **Avviso anticipato**: Railway ti avvisa quando raggiungi l'80%
2. **Sospensione temporanea**: Se finiscono, il servizio si sospende
3. **Rinnovo automatico**: I crediti si rinnovano ogni mese (restano 30 giorni)
4. **Upgrade facile**: Puoi aggiungere una carta e pagare solo per l'extra

## 🆚 Confronto con Altre Piattaforme

| Piattaforma | Piano Gratuito | Limiti | Migliore Per |
|------------|----------------|--------|--------------|
| **Railway** | $5 crediti/mese | Nessun limite hard | **Progetti seri** |
| Render | Gratuito | Spegne dopo 15min | Progetti personali |
| Heroku | Non più gratuito | $7+/mese minimo | Progetti legacy |
| Vercel | Gratuito | Solo frontend | Siti statici |
| Fly.io | Gratuito | Limiti severi | Microservizi |

## 🎯 Conclusione per il Tuo Progetto

**Per Atelier Persicu:**

✅ **Con $5/mese hai più che abbastanza:**
- Server sempre attivo
- Database MySQL
- Traffico moderato (centinaia di richieste/giorno)
- Supporto SSL gratuito
- Deploy automatico

✅ **Non supererai i $5 se:**
- Hai <100 utenti attivi/giorno
- Database <10GB
- Traffico <100GB/mese
- Server con <1GB RAM

❌ **Potresti superare $5 se:**
- Diventi molto popolare (migliaia di utenti/giorno)
- Molto traffico (>100GB/mese di egress)
- Server più potenti (2GB+ RAM, 2+ vCPU)
- Più servizi attivi contemporaneamente

## 📞 Se Serve Più Potenza

Se un giorno supererai i $5:
- **Railway Hobby**: $5/mese = $10 totali crediti/mese
- **Railway Pro**: $20/mese = $25 totali crediti/mese
- **Pay as you go**: Paghi solo per l'extra oltre i crediti

---

**TL;DR**: Con $5 di crediti gratuiti/mese, il tuo progetto Atelier Persicu probabilmente consumerà **~$1-2/mese**, lasciandoti ampio margine ($3-4) per crescere. Railway è perfetto per il tuo caso! 🚀

**Come si consumano i crediti:**
- ⏱️ **Tempo**: Al secondo, solo quando il servizio è attivo
- 💾 **RAM**: $0.00000386/GB/secondo
- 🖥️ **CPU**: $0.00000772/vCPU/secondo
- 📡 **Egress**: $0.05/GB (solo dati in uscita)
- 💿 **Storage**: Quasi gratuito ($0.00000006/GB/secondo)

