# Primeri uporabe

## Primer 1: Registracija in prijava uporabnika v spletno aplikacijo

Uporabnik odpre SmartLocker spletno aplikacijo, ustvari racun in se prijavi. Backend preveri podatke, ustvari JWT token in uporabniku omogoci dostop do nadzorne plosce.

Koraki:

1. Uporabnik odpre frontend.
2. Izbere registracijo.
3. Vnese uporabnisko ime in geslo.
4. Sistem shrani uporabnika v MongoDB.
5. Uporabnik se prijavi.
6. Sistem vrne token.
7. Frontend prikaze nadzorno plosco.

## Primer 2: Upravljanje paketnikov in rezervacij

Lastnik paketnika v spletnem portalu doda paketnik in spremlja rezervacije.

Koraki:

1. Uporabnik se prijavi.
2. Odpre seznam paketnikov.
3. Doda nov paketnik z ID-jem.
4. Ustvari ali pregleda rezervacijo.
5. Sistem shrani podatke v MongoDB.
6. V dnevniku vidi kasnejsa odklepanja.

## Primer 3: Preverjanje obraza v ORV API-ju

Gost ob rezervaciji poslje obrazni vzorec. Ob prihodu sistem primerja novo sliko s shranjenim vzorcem.

Koraki:

1. Gost ustvari rezervacijo preko `/reservations/create`.
2. API shrani obrazni vzorec.
3. Gost kasneje poslje novo sliko preko `/reservations/verify`.
4. Sistem zazna obraz, izracuna embedding in preveri ujemanje.
5. Ce je ujemanje dovolj dobro, vrne potrjeno rezervacijo in ID omarice.

## Primer 4: Odpiranje paketnika z mobilno aplikacijo

Mobilna aplikacija skenira QR kodo, iz nje pridobi ID paketnika in poklice Direct4me API.

Koraki:

1. Uporabnik odpre Android aplikacijo.
2. Klikne `Skeniraj QR kodo`.
3. Aplikacija iz QR kode izloci `boxId`.
4. Poklice Direct4me OpenBox API.
5. API vrne zvocni zeton.
6. Aplikacija predvaja zeton.
7. Uporabnik potrdi, ali se je paketnik odprl.
8. Dogodek se shrani v lokalno zgodovino in v Firestore.

## Primer 5: Pregled zgodovine odklepanj

Uporabnik lahko v mobilni aplikaciji ali spletnem portalu pregleda zgodovino odklepanj.

Koraki:

1. Uporabnik odpre zgodovino.
2. Sistem prikaze cas odklepanja, ID paketnika, uspeh/neuspeh in lokacijo, ce je dovoljena.
3. Uporabnik lahko preveri statistiko uspesnih in neuspesnih odpiranj.
