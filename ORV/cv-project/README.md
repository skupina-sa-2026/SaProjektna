# Airbnb Smart Locker

Projekt za predmet **Osnove računalniškega vida**.

Rešitev je aplikativni sistem za Airbnb pametno omarico. Gost ob rezervaciji shrani obrazni vzorec, sistem mu dodeli omarico, ob prihodu pa API preveri rezervacijo in obrazno identiteto. Če je rezervacija veljavna in je obraz potrjen, sistem vrne odločitev, da je omarico dovoljeno odkleniti.

## Kaj projekt vsebuje

- zajem slike prek spletnega vmesnika, mobilne aplikacije ali kamere,
- pripravo podatkov: zaznava obraza, izrez, sivinska slika, normalizacija, resize,
- augmentacijo podatkov: rotacija, sprememba svetlosti, kontrasta in blur,
- računalniški vid: OpenCV YuNet zaznava obraza, SFace embedding in primerjanje z registriranimi vzorci,
- preverjanje kakovosti slike,
- FastAPI strežnik,
- spletni vmesnik za rezervacijo, preverjanje gosta in odklep omarice,
- primer Kotlin razreda za Android integracijo,
- Dockerfile,
- navodila za zagon,
- poročilo v mapi `docs`.

## Struktura

```text
cv-project/
├── api/
│   └── main.py
├── model/
│   └── face_auth.py
├── scripts/
│   ├── capture_images.py
│   ├── prepare_dataset.py
│   ├── evaluate_model.py
│   └── FaceAuthApi.kt
├── data/
│   ├── users/
│   ├── model/
│   ├── import/
│   └── test_images/
├── docs/
│   └── porocilo.docx
├── requirements.txt
├── start.sh
├── start.bat
├── Dockerfile
└── README.md
```

## Zagon na Windows

V mapi projekta odpri PowerShell ali CMD in zaženi:

```bat
start.bat
```

Če ne želiš uporabiti `start.bat`, lahko ročno zaženeš:

```bat
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

## Zagon na Linux/macOS

```bash
chmod +x start.sh
./start.sh
```

## Zagon z Dockerjem

```bash
docker build -t orv-face-access .
docker run --rm -p 8000:8000 -v "$(pwd)/data:/app/data" orv-face-access
```

Na Windows PowerShell:

```powershell
docker build -t orv-face-access .
docker run --rm -p 8000:8000 -v "${PWD}/data:/app/data" orv-face-access
```

## Uporaba v brskalniku

Ko se strežnik zažene, odpri:

```text
http://localhost:8000
```

## Kako prikažeš, da deluje

1. Zaženi strežnik.
2. Odpri `http://localhost:8000`.
3. V delu **Rezervacija gosta** vpiši ime gosta in izberi jasno sliko obraza.
4. Klikni **Ustvari rezervacijo**. Sistem vrne ID rezervacije, na primer `AIR-0001`, in dodeljeni ID omarice.
5. Za istega gosta dodaj še 1 do 3 jasne slike, da ima model več vzorcev iste osebe.
6. V delu **Preverjanje rezervacije** vpiši isto ime in izberi novo sliko iste osebe.
7. Klikni **Preveri rezervacijo**. Če je obraz dovolj podoben, sistem izpiše `reservation_id` in dodeljeni `locker_id`.
8. Nato poskusi z drugo osebo. Sistem mora vrniti `authenticated: false`.
9. V delu **Odklep omarice** vpiši ime gosta in ID rezervacije, ki ga je sistem vrnil pri rezervaciji.
10. Pošlji sliko potrjene osebe. Če sta rezervacija in obraz potrjena, API vrne `allowed: true`.

## API endpointi

### Registracija uporabnika

```http
POST /auth/enroll
```

Form-data:

```text
username = rok
image = slika.jpg
```

### Ustvarjanje Airbnb rezervacije

```http
POST /reservations/create
```

Form-data:

```text
username = ime_gosta
image = slika.jpg
```

API vrne `reservation_id` in dodeljeni `locker_id`.

### Preverjanje identitete

```http
POST /auth/verify
```

Form-data:

```text
username = rok
image = nova_slika.jpg
```

### Preverjanje rezervacije gosta

```http
POST /reservations/verify
```

Form-data:

```text
username = ime_gosta
image = nova_slika.jpg
```

Če je gost potrjen, API vrne tudi aktivno rezervacijo in dodeljeno omarico.

### Odklep omarice prek rezervacije

```http
POST /reservations/check-access
```

Form-data:

```text
username = ime_gosta
reservation_id = AIR-0001
image = slika.jpg
```

### Preverjanje dostopa do omarice z ročnim ID-jem

```http
POST /box/check-access
```

Form-data:

```text
username = rok
box_id = id_omarice
image = slika.jpg
```

### Seznam uporabnikov

```http
GET /users
```

### Metrike modela

```http
GET /model/metrics
```

### Ponovno učenje modela

```http
POST /model/retrain
```

### Brisanje uporabnika

```http
DELETE /users/rok
```

## Zajem podatkov s kamero

```bash
python scripts/capture_images.py rok
```

Pritisni `SPACE`, da shraniš sliko. Pritisni `ESC`, da končaš.

## Priprava podatkov iz mape

Ustvari mapo:

```text
data/import/rok/
```

V njo dodaj slike obraza in zaženi:

```bash
python scripts/prepare_dataset.py
```

## Vrednotenje modela

```bash
python scripts/evaluate_model.py
```

Ali prek API-ja:

```text
http://localhost:8000/model/metrics
```

Primer rezultata pri trenutnem testiranju s tremi registriranimi gosti:

| Metrika | Vrednost |
|---|---:|
| accuracy | 1.0 |
| train_samples | 42 |
| test_samples | 14 |
| average_distance | 0.0056 |
| threshold | 0.56 |
| top3_threshold | 0.64 |
| center_threshold | 0.68 |

Testni uporabniki in rezervacije:

| Gost | Vzorci | Rezervacija | Omarica |
|---|---:|---|---:|
| Bill Gates | 24 | AIR-0001 | 352 |
| Jake Paul | 16 | AIR-0002 | 358 |
| Logan Paul | 16 | AIR-0003 | 359 |

## Razdelitev dela

| Član | Odgovornost |
|---|---|
| Rok Kogovšek | API, povezava sistema, spletni vmesnik, Docker/start skripte, navodila za zagon in integracija Airbnb smart locker odklepa |
| Jure Vidmar | zajem in priprava podatkov, augmentacija, model računalniškega vida, YuNet/SFace embeddingi, pragovi odločanja, vrednotenje in testiranje |

## Kaj moraš povedati pri predstavitvi

Sistem uporablja OpenCV YuNet za zaznavo obraza in SFace za izračun obraznega embeddinga. Ko je obraz zaznan, se s pomočjo obraznih točk poravna na velikost 112 x 112 slikovnih pik. Nato se iz poravnanega obraza izračuna 128-dimenzionalni embedding, ki opisuje identiteto obraza. Pri preverjanju se embedding nove slike primerja s shranjenimi embeddingi registriranega uporabnika. Sistem preveri najboljše ujemanje, povprečje treh najbližjih vzorcev, povprečno razdaljo do uporabnika, razliko do drugega najboljšega uporabnika in kakovost slike. Če slika ni dovolj podobna ali je slabe kakovosti, se dostop zavrne.

## Pomembno pri testiranju

Za boljšo prepoznavo ne registriraj samo ene slike. Za isto osebo dodaj več slik z različnimi pogoji:

- normalna slika,
- malo drugačna svetloba,
- druga razdalja od kamere,
- obraz naj bo spredaj in jasno viden.

To zmanjša možnost napačnih potrditev in izboljša delovanje sistema.
