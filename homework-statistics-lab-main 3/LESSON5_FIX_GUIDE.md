# Statistics.Lab · Lesson 05 repaired (11 November 2026)

## What was broken

- The homepage used `href="LESSON5/"`, while the actual page was in `homeworks/LESSON5/`: opening the homepage card returned a 404.
- From inside `homeworks/LESSON5/`, the `../index.html` back link incorrectly pointed to `homeworks/index.html`, which does not exist.
- The homepage used an injected card and a MutationObserver workaround outside its native card registry. Search, filters and the automatic counter were inconsistent.

## What's fixed

- Canonical Lesson 05 is now `homeworks/lesson-05/index.html`, using the same naming convention as the earlier lessons.
- All the original Lesson 05 JavaScript, CSS, theory, tests and data are preserved.
- Its home link now points to `../../index.html`.
- Lesson 05 is registered in `assets/site.js` alongside Lessons 01–04. The existing lesson search, filters and card style now work natively.
- Two compatibility redirects preserve both `LESSON5/` and `homeworks/LESSON5/` URLs.

## Upload to GitHub (website UI)

1. Back up your repository first.
2. Open your GitHub repository, then use **Add file → Upload files**.
3. Upload the **contents** of this `homework-statistics-lab-main` folder into your repository root, retaining the subfolder paths, including `assets/site.js`, `index.html`, `homeworks/lesson-05/` and both redirects. Don't upload the ZIP itself as a file, and don't create a nested `homework-statistics-lab-main/` directory.
4. Commit the changes and confirm your deployment in **Settings → Pages** (main, root) and **Actions**.
5. Open `/homeworks/lesson-05/`; test the main card, both exercises, and the **Homeworks** link.

To avoid duplicate legacy scripts, old `homeworks/LESSON5/` files may be deleted except for its `index.html` redirect, but this is optional. GitHub's web uploader doesn't automatically delete files.

## Quick local verification

From the repository root run `python3 -m http.server 8000`, open `http://localhost:8000/` and test the Lesson 05 card. With Node.js installed, `node homeworks/lesson-05/test.js` runs the numeric checks.
