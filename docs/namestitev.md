# Navodila za namestitev

## Namen projekta

Projekt predstavlja sistem pametnega paketnika. Spletni del omogoca registracijo in prijavo uporabnikov, upravljanje paketnikov, rezervacij in dnevnika odklepanj. ORV del izvaja preverjanje obraza preko FastAPI streznika. Mobilna aplikacija omogoca skeniranje QR kode paketnika, klic Direct4me OpenBox API-ja, predvajanje zvocnega zeton in belezenje zgodovine.

## Potrebna programska oprema

Za najlazji zagon potrebujete:

- Git,
- Docker Desktop,
- Node.js 22 ali novejsi,
- Python 3.11,
- Android Studio z Android SDK,
- dostop do GitHub repozitorija.

## Kloniranje repozitorija

```bash
git clone URL_REPOZITORIJA
cd SaProjektna
```

## Konfiguracija okolja

Kopirajte primer konfiguracije:

```bash
cp .env.example .env
```

V `.env` po potrebi nastavite:

```text
PORT=5000
MONGO_URI=mongodb://mongo:27017/airbnb_smart_locker
JWT_SECRET=zamenjaj_to_skrivnost
VITE_API_URL=http://localhost:5000
```

Pravi kljuci se ne commitajo v GitHub.

## Zagon celotnega sistema z Dockerjem

V korenu projekta zazenite:

```bash
docker compose up --build
```

S tem se postavijo:

- MongoDB podatkovna baza,
- SmartLocker Node/Express API,
- React frontend,
- ORV FastAPI face recognition API.

## Lokalni zagon SmartLocker API-ja

```bash
cd RAI/SmartLocker
cp .env.example .env
npm install
npm start
```

API tece na `http://localhost:5000`, ce je v `.env` nastavljen `PORT=5000`.

## Lokalni zagon SmartLocker frontenda

```bash
cd RAI/SmartLocker/frontend
cp .env.example .env
npm install
npm run dev
```

Frontend se odpre na URL-ju, ki ga izpise Vite.

## Lokalni zagon ORV face API-ja

```bash
cd ORV/cv-project
python -m venv .venv
.venv\Scriptsctivate
python -m pip install -r requirements.txt
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

Na Linux/macOS namesto `.venv\Scriptsctivate` uporabite:

```bash
source .venv/bin/activate
```

## Zagon Android aplikacije

1. Odprite Android Studio.
2. Izberite mapo `PJ/MobiApp`.
3. Pocakajte Gradle Sync.
4. Ustvarite datoteko `local.properties` po zgledu `local.properties.example`.
5. Vnesite `DIRECT4ME_API_KEY`.
6. Povezite telefon ali zazenite emulator.
7. Kliknite Run.

## Pogoste napake

### MONGO_URI ni nastavljen

V `RAI/SmartLocker/.env` dodajte `MONGO_URI`.

### Frontend klice napacen port

V `RAI/SmartLocker/frontend/.env` nastavite:

```text
VITE_API_URL=http://localhost:5000
```

### Direct4me API kljuc ni nastavljen

V `PJ/MobiApp/local.properties` nastavite:

```text
DIRECT4ME_API_KEY=vas_kljuc
```

### Android projekt ne zgradi

Preverite, da ni conflict markerjev in da je datoteka `google-services.json` pravilna za vas Firebase projekt.
