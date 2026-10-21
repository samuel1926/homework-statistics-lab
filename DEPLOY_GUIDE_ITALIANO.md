# Guida per aggiornare Statistics.Lab su GitHub

Repository: https://github.com/samuel1926/homework-statistics-lab
Sito: https://samuel1926.github.io/homework-statistics-lab/

## Prima di cominciare

Questa versione riorganizza 3 esercizi in **2 lezioni**:

- Lezione 01: stessa pagina, due parti (Curve ellittiche ed Ethereum Wallet)
- Lezione 02: Caesar, secp256k1 e Statistical Cryptanalysis

La grafica è coordinata su tutte le pagine. La prima lezione incorpora i due laboratori originali in sezioni consecutive, senza duplicare le intestazioni, mantenendo gli script separati per evitare collisioni tecniche.

## Metodo consigliato: GitHub Desktop

1. Scarica e conserva una copia di backup del vecchio repository.
2. Installa/apri GitHub Desktop. Da **File → Clone repository** seleziona `samuel1926/homework-statistics-lab`.
3. Estrai lo ZIP nuovo.
4. Apri nel Finder/Esplora file la cartella locale clonata da GitHub Desktop.
5. **Copia tutto il contenuto** della cartella `homework-statistics-lab-main` contenuta nel nuovo ZIP dentro la cartella clonata del repository; sostituisci i file esistenti.
6. Se vuoi eliminare eventuali vecchi file non più necessari nella cartella `homeworks/HMWK3`, conserva soltanto `index.html` (è un reindirizzamento). Non toccare la cartella nascosta `.git`.
7. In GitHub Desktop controlla le modifiche, inserisci come Summary `Unify lessons and site design`, premi **Commit to main** e poi **Push origin**.
8. Apri GitHub → **Actions** e controlla che il deploy Pages termini correttamente. Poi apri il sito e aggiorna con Cmd+Shift+R (Mac) o Ctrl+Shift+R (Windows).

## Alternativa: aggiornamento manuale dal sito di GitHub

Il sito di GitHub non decomprime ZIP automaticamente. La vecchia interfaccia di upload potrebbe non accettare intere cartelle. Serve caricare **ogni file nel percorso corretto**, creando prima le nuove cartelle. Non caricare lo ZIP così com'è e non caricare `homework-statistics-lab-main` come sottocartella del repository: `index.html` deve restare nella directory principale.

File da sostituire: `index.html`, `README.md`, `assets/site.js`, `homeworks/hmwk-01/index.html`, `homeworks/hmwk-02/index.html`. Da aggiungere: nuovi CSS/JS in `assets/`, le due cartelle `homeworks/lesson-01` e `homeworks/lesson-02` e questa guida. Le cartelle originali `hmwk-01` e `hmwk-02` con `script.js`, `styles.css`, `crypto.js` e gli altri file non vanno cancellate: servono ancora per eseguire i moduli della Lezione 01.

Per la cartella `HMWK3`, il vecchio `index.html` va sostituito con il redirect incluso nel pacchetto. È possibile lasciare i vecchi script anche se non vengono utilizzati, ma con GitHub Desktop si possono eliminare.

## Collegamenti previsti

- Homepage: `https://samuel1926.github.io/homework-statistics-lab/`
- Lezione 01: `https://samuel1926.github.io/homework-statistics-lab/homeworks/lesson-01/`
- Lezione 02: `https://samuel1926.github.io/homework-statistics-lab/homeworks/lesson-02/`

## Controlli dopo il deploy

1. La homepage mostra **02 published lessons**, con due schede cliccabili.
2. Ricerca `wallet` → Lezione 01; ricerca `Caesar` → Lezione 02.
3. I filtri `Lesson 01` e `Lesson 02` visualizzano la scheda corretta.
4. In Lezione 01 scorri nella stessa pagina da **Part 01** a **Part 02**. Entrambe devono mostrare i grafici e permettere di usare i controlli.
5. In Lezione 02 prova il cifrario di Cesare, l'attacco statistico, gli esperimenti e il recupero della chiave ECC.
6. Clicca su `Statistics.Lab` in alto e torna alla homepage.
7. Verifica anche da smartphone.

**Nota:** gli script del secondo laboratorio usano `type="module"` e Web Crypto, perciò è corretto provarli via HTTPS su GitHub Pages oppure su un server locale `http://localhost`, non aprendo direttamente `index.html` dal Finder.
