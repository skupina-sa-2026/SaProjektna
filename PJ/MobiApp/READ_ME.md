# Pametni paketnik - mobilna aplikacija

Projekt vsebuje Android aplikacijo za Direct4me pametni paketnik.

## Narejeno

- QR skeniranje paketnika.
- Branje ID-ja paketnika iz QR kode.
- Klic Direct4me OpenBox API-ja.
- Pošiljanje `boxId` in `tokenFormat`.
- Branje JSON odgovora.
- Dekodiranje Base64 podatkov.
- Razpakiranje ZIP odgovora.
- Iskanje `.wav` žetona.
- Predvajanje žetona z `MediaPlayer`.
- Zgodovina odpiranj.
- Lokalno shranjevanje zgodovine.
- Firebase Firestore shranjevanje zgodovine.
- Statistika odpiranj.
- Beleženje lokacije odpiranja, če uporabnik dovoli lokacijo. V aplikaciji se prikaže približen kraj, npr. `Maribor, Slovenija`, ne surove koordinate.
- Minimalističen in bolj profesionalen Jetpack Compose UI.

## Opcija 2

Za opcijo 2 so dodani:

1. Firebase Firestore shranjevanje zgodovine odpiranj.
2. Statistika odpiranj v aplikaciji.
3. Beleženje lokacije prevzema oziroma odpiranja paketnika. Koordinate se uporabijo samo za pridobitev približnega kraja, v vmesniku pa se pokaže bolj normalen zapis lokacije.

## Pomembno za Firebase

V projektu je dodan `app/google-services.json`, ampak je to demo datoteka. Pred oddajo ustvarite svoj Firebase projekt, dodajte Android aplikacijo s package name:

```text
com.example.mobiapp
```

Nato iz Firebase konzole prenesite pravi `google-services.json` in z njim zamenjajte obstoječo datoteko.

V Firebase konzoli morate ustvariti Firestore Database. Za testiranje lahko začasno uporabite test mode, pred pravo uporabo pa nastavite varnostna pravila.

## Testiranje

1. Odpri projekt v Android Studio.
2. Sync Gradle.
3. Zamenjaj `google-services.json` s pravim Firebase configom.
4. Zaženi aplikacijo na telefonu ali emulatorju.
5. Pritisni `Skeniraj QR kodo` in skeniraj QR paketnika.
6. Za test lahko uporabiš gumb `Testno odpri paketnik #352`.
7. Preveri, da se po odpiranju doda zapis v zgodovino.
8. V Firebase konzoli preveri kolekcijo `openingHistory`.

