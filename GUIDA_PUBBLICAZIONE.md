# 🚀 Guida Deployment su Netlify - Inventario Pro

## 📋 Preparazione Completata ✅

Il tuo progetto è **pronto per il deployment**! Sono stati creati i seguenti file:

- ✅ `netlify.toml` - Configurazione Netlify ottimizzata per PWA
- ✅ `_headers` - Headers di sicurezza e cache
- ✅ `.gitignore` - File da escludere dal deployment

---

## 🎯 Metodo 1: Deploy con Drag & Drop (PIÙ SEMPLICE)

### Passo 1: Crea un account Netlify
1. Vai su [netlify.com](https://www.netlify.com)
2. Clicca su **"Sign up"**
3. Registrati con email o GitHub (consigliato GitHub)

### Passo 2: Prepara la cartella
1. Apri la cartella `INVENTARIO PRO` sul desktop
2. Seleziona **TUTTI** i file:
   - `index.html`
   - `manifest.json`
   - `sw.js`
   - `netlify.toml`
   - `_headers`
   - `.gitignore`

### Passo 3: Deploy
1. Vai su [app.netlify.com/drop](https://app.netlify.com/drop)
2. **Trascina la cartella** (o i file selezionati) nell'area indicata
3. Attendi il caricamento (circa 10-30 secondi)
4. **FATTO!** 🎉

### Passo 4: Ottieni il link
- Netlify ti darà un URL tipo: `https://random-name-123456.netlify.app`
- Puoi personalizzarlo cliccando su **"Site settings" → "Change site name"**
- Esempio: `https://inventario-pro.netlify.app`

---

## 🔧 Metodo 2: Deploy con GitHub (PIÙ AVANZATO)

### Vantaggi
- ✅ Aggiornamenti automatici quando modifichi il codice
- ✅ Storico delle versioni
- ✅ Rollback facile

### Passo 1: Crea un repository GitHub
1. Vai su [github.com](https://github.com)
2. Clicca su **"New repository"**
3. Nome: `inventario-pro`
4. Scegli **"Public"** o **"Private"**
5. Clicca **"Create repository"**

### Passo 2: Carica i file su GitHub
Puoi usare:
- **GitHub Desktop** (più semplice)
- **Git da terminale** (più avanzato)

#### Opzione A: GitHub Desktop
1. Scarica [GitHub Desktop](https://desktop.github.com/)
2. Clicca **"Add" → "Add existing repository"**
3. Seleziona la cartella `INVENTARIO PRO`
4. Clicca **"Publish repository"**

#### Opzione B: Git da terminale
```powershell
cd "C:\Users\info\Desktop\INVENTARIO PRO"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TUO-USERNAME/inventario-pro.git
git push -u origin main
```

### Passo 3: Collega Netlify a GitHub
1. Vai su [app.netlify.com](https://app.netlify.com)
2. Clicca **"Add new site" → "Import an existing project"**
3. Scegli **"GitHub"**
4. Autorizza Netlify
5. Seleziona il repository `inventario-pro`
6. Configurazione:
   - **Build command**: lascia vuoto
   - **Publish directory**: `.` (punto)
7. Clicca **"Deploy site"**

---

## 📱 Installare l'App sul Tablet

### Dopo il deployment:

1. **Apri il link** sul tablet (es. `https://inventario-pro.netlify.app`)
2. Il browser chiederà di **"Installare l'app"** o **"Aggiungi a schermata Home"**
3. Accetta l'installazione
4. L'app apparirà come un'app nativa sul tablet! 🎉

### Browser supportati:
- ✅ Chrome/Edge (Android)
- ✅ Safari (iOS/iPadOS)
- ✅ Firefox (Android)

---

## 🔄 Aggiornare l'App

### Metodo 1 (Drag & Drop):
1. Vai su [app.netlify.com](https://app.netlify.com)
2. Seleziona il tuo sito
3. Vai su **"Deploys"**
4. Trascina i file aggiornati

### Metodo 2 (GitHub):
1. Modifica i file localmente
2. Fai commit e push su GitHub
3. Netlify aggiornerà automaticamente! ✨

---

## 🎨 Personalizzare il Dominio (Opzionale)

### Dominio Netlify gratuito:
1. Vai su **"Site settings" → "Domain management"**
2. Clicca **"Options" → "Edit site name"**
3. Scegli un nome: `inventario-pro.netlify.app`

### Dominio personalizzato (es. inventario.tuodominio.com):
1. Acquista un dominio (es. su Namecheap, Google Domains)
2. Vai su **"Domain management" → "Add custom domain"**
3. Segui le istruzioni per configurare i DNS

---

## ✅ Checklist Finale

Prima di andare live:

- [ ] Hai testato l'app in locale?
- [ ] Tutti i file sono nella cartella?
- [ ] Hai creato l'account Netlify?
- [ ] Hai fatto il deploy?
- [ ] L'app si apre correttamente dal link?
- [ ] Hai testato l'installazione sul tablet?
- [ ] La sincronizzazione con Google Sheets funziona?

---

## 🆘 Problemi Comuni

### ❌ "Page not found"
- Verifica che `index.html` sia nella root della cartella
- Controlla che `netlify.toml` sia presente

### ❌ Service Worker non funziona
- Assicurati che il sito usi HTTPS (Netlify lo fa automaticamente)
- Controlla che `sw.js` sia nella root

### ❌ PWA non si installa
- Verifica che `manifest.json` sia presente
- Controlla che il sito sia HTTPS
- Prova a ricaricare la pagina (Ctrl+Shift+R)

### ❌ Google Sheets non sincronizza
- Verifica che l'URL dello script Google Apps sia corretto nell'`index.html`
- Controlla i permessi dello script

---

## 📞 Link Utili

- 📚 [Documentazione Netlify](https://docs.netlify.com/)
- 🎓 [Netlify PWA Guide](https://docs.netlify.com/configure-builds/common-configurations/progressive-web-apps/)
- 💬 [Netlify Community](https://answers.netlify.com/)

---

## 🎉 Pronto per il Deploy!

Tutto è configurato! Scegli il metodo che preferisci e in pochi minuti avrai la tua app online! 🚀

**Link rapido per iniziare**: [app.netlify.com/drop](https://app.netlify.com/drop)
