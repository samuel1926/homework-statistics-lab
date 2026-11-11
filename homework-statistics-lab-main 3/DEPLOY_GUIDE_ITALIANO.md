# Statistics.Lab — Aggiornamento completo del sito (5 lezioni)

Questa versione corregge il collegamento della Lesson 5 e la integra nella homepage esistente, senza eliminare le lezioni 1–4.

## Quali file sono importanti?

- **`index.html`** nella cartella principale: homepage originale aggiornata.
- **`assets/site.js`**: registro ufficiale delle cinque lezioni, comprese ricerca, filtri, contatori e schede.
- **`homeworks/lesson-05/`**: la nuova pagina completa con **entrambi** gli homework, gli script e i fogli di stile.
- **`LESSON5/index.html`** e **`homeworks/LESSON5/index.html`**: reindirizzano i vecchi collegamenti alla nuova pagina.

La lezione si apre da `homeworks/lesson-05/` (tutto minuscolo e con trattino). Il sito non usa `LESSON5/` come percorso principale.

## Come aggiornare con il sito web di GitHub

1. Esegui un backup del repository (pulsante **Code → Download ZIP**).
2. Estrai il nuovo ZIP che ti ho fornito.
3. Apri la **cartella `homework-statistics-lab-main` estratta**. I file dentro devono essere il contenuto da caricare; non caricare la cartella intera come livello aggiuntivo né lo ZIP non estratto.
4. Nel tuo repository GitHub, scegli **Add file → Upload files** e trascina i file/cartelle presenti al suo interno, mantenendo i loro percorsi. Puoi anche sostituire manualmente i due file `index.html` e `assets/site.js`, quindi caricare `homeworks/lesson-05/` e i due file di reindirizzamento nelle rispettive posizioni.
5. Conferma con **Commit changes**.
6. Controlla **Settings → Pages** (deploy dal branch `main`, cartella `/(root)`) e lo stato della pubblicazione in **Actions**. Ricarica il sito con `Cmd+Shift+R` (Mac) o `Ctrl+Shift+R` (Windows).

### Attenzione a non fare questi errori

- Non inserire un'altra cartella chiamata `homework-statistics-lab-main` dentro il repository: il file principale deve essere sempre `/index.html`.
- Non usare la vecchia homepage che contiene il link `href="LESSON5/"`.
- Non creare manualmente una seconda scheda per Lesson 5 nella homepage: la nuova versione di `assets/site.js` la genera automaticamente.
- Non cancellare `homeworks/hmwk-01`, `homeworks/hmwk-02` o le quattro lezioni precedenti.
- Eventuali vecchi file ancora presenti in `homeworks/LESSON5/` possono restare: è sufficiente che il relativo `index.html` venga sostituito dal reindirizzamento.

## Controlli dopo la pubblicazione

1. Nella homepage deve comparire **05 published lessons** e **cinque schede**, tutte nello stesso stile.
2. Il filtro **Lesson 05** deve mostrare **solo** la Lesson 5; cercando `Gaussian` la scheda deve comparire, cercando un termine inesistente no.
3. Clicca Lesson 5 e verifica che si apra `homeworks/lesson-05/`.
4. Verifica che entrambi gli homework funzionino: scelta delle funzioni nell'esercizio 1; modifica del valore z nella CDF nell'esercizio 2.
5. Da Lesson 5, clicca **Homeworks** per tornare alla homepage.
6. I link precedenti `LESSON5/` e `homeworks/LESSON5/` devono reindirizzarti automaticamente alla nuova pagina.

## Verifica locale

Da terminale nella cartella principale:

```bash
python3 -m http.server 8000
```

Apri `http://localhost:8000/`. Se hai Node.js:

```bash
node homeworks/lesson-05/test.js
```

## Cosa era successo?

Il collegamento della homepage era `LESSON5/`, mentre la cartella effettiva era `homeworks/LESSON5/`. Inoltre il pulsante di ritorno puntava erroneamente a `homeworks/index.html`. Ho riallineato i percorsi e sostituito la vecchia scheda aggiunta da uno script separato con una scheda gestita dal JavaScript ufficiale della homepage.
