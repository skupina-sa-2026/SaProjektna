# Varnost

## Obcutljivi podatki

V repozitorij ne sodijo:

- `.env`,
- `local.properties`,
- pravi Direct4me API kljuc,
- produkcijski JWT secret,
- zasebni Firebase kljuci.

Zato projekt vsebuje samo primere:

- `.env.example`,
- `local.properties.example`.

## Direct4me API kljuc

V mobilni aplikaciji je bil prej API kljuc zapisan neposredno v `ApiService.kt`. To je popravljeno tako, da aplikacija vrednost prebere iz `BuildConfig`, ta pa se napolni iz `local.properties` oziroma GitHub Secrets.

## JWT

SmartLocker backend uporablja `JWT_SECRET`. V produkciji mora biti ta vrednost dolga in nakljucna.

## MongoDB

MongoDB je v Docker Compose nastavljen za lokalno uporabo. Za produkcijo bi dodali uporabnisko ime, geslo, omejitev porta in dostop samo iz backend kontejnerja.

## Firewall

Za predstavitev je dovolj lokalni Docker. V produkciji bi javno odprli samo frontend in API vrata, dostop do baze pa bi ostal zaprt.
