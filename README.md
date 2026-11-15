# קבוצת כפרי נדל״ן – אתר תדמית

אתר סטטי בעברית (RTL). האתר החי: https://kafri-nadlan.netlify.app

## מבנה
- `src/` – המקור: `css/`, `js/` (כולל `nav.tsx` – סרגל הניווט), `partials/` (כותרת עליונה ותחתונה), `pages/` (דף הבית ועמוד הפרויקט), `articles/` (המאמרים).
- `tools/build-site.ps1` – בונה מהמקור את הקבצים שמוגשים: `index.html`, `rehovot/`, `articles/`, `404.html`, `sitemap.xml`, `robots.txt`, `_headers`, `assets/site.css`, `assets/site.js`.
- `assets/` – קבצי העיצוב, הסקריפטים והתמונות (`assets/nav.js` הוא `src/js/nav.tsx` אחרי הידור).
- `serve.ps1` – שרת מקומי לתצוגה מקדימה (פורט 5173).
- `promo.html`, `promo2.html` – סרטוני פרסום (לא חלק מהאתר החי).

## עבודה שוטפת
1. עורכים קבצים בתוך `src/` (לא את `index.html` ישירות – הוא נוצר מחדש).
2. מריצים: `powershell -NoProfile -ExecutionPolicy Bypass -File tools\build-site.ps1`
3. בודקים מקומית עם `serve.ps1`, ואז מעלים לגיטהאב. Netlify מפרסם אוטומטית.

## הוספת מאמר
יוצרים קובץ ב-`src/articles/` עם כותרת פרטים (slug, order, date, title, h1, description, summary), שורה של `---`, ואחריה תוכן ה-HTML (`<p>`, `<h2>`, `<ul>`...). אחרי הבנייה המאמר מקבל כתובת `/articles/<slug>/`, מופיע ב-sitemap ובקישורי הפוטר.

## הוספת פרויקט
מוסיפים כרטיס ב-`src/pages/home.html` (באזור `#projects`) ועמוד ב-`src/pages/` (בדומה ל-`rehovot.html`), ומוסיפים קריאה לעמוד ב-`tools/build-site.ps1`.

## דומיין משלכם
כשמחברים דומיין, משנים את `$SiteUrl` בראש `tools/build-site.ps1`, בונים מחדש ומעלים.

## שינוי סרגל הניווט
`assets/nav.js` נוצר מ-`src/js/nav.tsx` בהידור (Babel). אם משנים את `nav.tsx`, צריך להדר מחדש לפני העלאה.