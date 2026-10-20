# Library Management System

A web application for managing a university library: books, students, loans and returns.

**Live demo:** https://hebboulchouaib.github.io/library-management-web-app/

You can try it straight away in guest mode, with no sign-up. Create an account if you want your own private library stored in the database.

This is the web version of a university project from the Database 1 module at USTHB (Faculty of Computer Science). The original was a desktop application written in Java, JavaFX and Oracle. I rebuilt it for the web so that anyone can open it from a link, with no installation or compilation.
Looking for the original desktop version? It is here: [Library Management System in Java, JavaFX and Oracle](https://github.com/hebboulchouaib/library-management-java-app).

## What it does

- **Books:** add, edit and delete, with a confirmation before deleting. Search by title, author or category, and filter by category.
- **Students:** add, edit, delete and list, with the number of loans each student currently has.
- **Loans and returns:** borrow a book for a chosen number of days and register its return. Stock goes down and up automatically. A board shows loans as in progress, late, or returned.
- **Dashboard:** totals, late returns to follow up, latest loans and a breakdown by category.
- **Analyses:** the most requested books, and the students who return books best. The return rate is books returned divided by books borrowed, and when two students have the same rate, the one who returned more books ranks higher.
- **Settings:** library name, default loan length, and export, import or erase of the data as a JSON file.
- Dark mode, and a layout that works on phones.

## Two ways to use it

Each account only ever sees its own data, and that is enforced by the database itself, not by the page.

## How it is built

- **Front end:** plain HTML, CSS and JavaScript. No framework and no build step.
- **Database and login:** [Supabase](https://supabase.com) (PostgreSQL and authentication). The `supabase-js` library (version 2.117.2) is included in `vendor/` so the site has no runtime dependency on a CDN.
- **Hosting:** GitHub Pages.
- **Keep-alive:** a scheduled GitHub Actions workflow sends a small request to the database twice a week, so the free Supabase project does not pause from inactivity.

### Database design

The three tables come from the original assignment (`etudiants`, `livres`, `emprunts`), with the same primary and foreign keys. The full script is in [`database/schema.sql`](database/schema.sql).

- **Row level security.** Every row has a `user_id`, and a policy on each table only allows a logged-in user to read or write rows that carry their own id. A visitor without an account has no access at all.
- **Composite foreign keys.** The foreign keys include `user_id`, so a loan cannot reference another user's book or student, even if a request is tampered with.
- **Transactions.** Borrowing and returning are PostgreSQL functions (`emprunter` and `rendre`). Each one updates the stock and the loan in a single transaction, and the database refuses to borrow a book with no copies left or to return the same loan twice.
- **Computed status.** The status of a loan (in progress, returned, late) is calculated from its dates rather than stored, because a stored value would become wrong as time passes.
- **History is kept.** Deleting a book or a student keeps their old loans, with the reference set to null.

The data layer in `app.js` has two implementations behind one interface, one for the browser's local storage and one for Supabase, so the rest of the app does not care where the data comes from.

## Project structure

```
index.html                  the page
style.css                   styles, dark mode and the mobile layout
app.js                      interface and data layer (browser storage and Supabase)
favicon.svg
privacy.html, terms.html    privacy policy and terms of use
vendor/supabase.js          supabase-js browser bundle
database/schema.sql         tables, security rules and functions
.github/workflows/         keep-alive job
```

## Notes

- This is a demonstration project. Please use made-up data and not real student information.
- Email confirmation is turned off on the demo so that anyone can try it quickly.
- Settings (library name, default loan length, theme) are saved in the browser, not in the account.

## Author

Chouaiib, third-year Computer Science student at USTHB, Algiers. [GitHub](https://github.com/hebboulchouaib)
