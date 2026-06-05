# 3D Printshop

Een fullstack 3D-print webshop met een configurator/builder voor custom figurine-stands.
Gebruikers kunnen producten kopen, offertes aanvragen en in een 3D omgeving een custom stand maken voor hun eigen figurines.

---

## Tech Stack

### Frontend / Fullstack
- Next.js (React) voor de frontend en server-side rendering

---

### 3D Builder
- Three.js voor 3D rendering en interactie
- Zustand voor state management in de builder

---

### Backend / Database
- Prisma ORM voor database interactie
- PostgreSQL als database

---

### Auth & Payments (Webshop)
- Mollie API voor iDEAL/PAYPAL betalingen
- JWT voor authenticatie

---

### File Uploads (Offertes)
- Uploadthing voor veilige file uploads

---

### Styling
- Tailwind CSS voor snelle styling en responsive design

---

### Hosting
- Vercel voor hosting
---

## Installatie (voorbeeld)

```bash
git clone https://github.com/jouw-repo/3d-printshop.git
cd 3d-printshop
npm install
npm run dev
```

### Maak een `.env` bestand aan met de volgende variabelen:
```
DATABASE_URL=postgresql://user:password@localhost:5432/3dprintshop
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```
### Run database migraties:
```bash
npx prisma generate
npx prisma migrate dev --name init
```
