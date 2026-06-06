# Terminski plan projekta

## 1. Uvod

Projekt Pametni paketnik zdruzuje znanje iz vec projektnih predmetov. Cilj je izdelati sistem, ki podpira uporabo pametnega paketnika oziroma omarice v scenariju oddaje nastanitve. Sistem vsebuje spletni portal, storitev za preverjanje obraza, mobilno aplikacijo za odpiranje paketnika in administracijski del, ki skrbi za verzioniranje kode, Docker, CI/CD, varnost in dokumentacijo.

## 2. Sestavni deli sistema

### RAI - SmartLocker

Spletna aplikacija SmartLocker vsebuje Node/Express REST API in React frontend. Backend skrbi za uporabnike, prijavo, paketnike, rezervacije in dnevnik odklepanj. Podatki se hranijo v MongoDB.

### ORV - cv-project

ORV del vsebuje FastAPI streznik, ki izvaja racunalniski vid. Projekt uporablja OpenCV, zaznavo obraza, pripravo podatkov, ucenje oziroma shranjevanje vzorcev in preverjanje identitete gosta.

### PJ - MobiApp

Mobilna aplikacija je Android aplikacija, ki omogoca skeniranje QR kode, izlocanje ID-ja paketnika, klic Direct4me OpenBox API-ja, predvajanje zvocnega zetona, potrjevanje rezultata in belezenje zgodovine odpiranj.

### SA - Sistemska administracija

Pri tem predmetu je poudarek na organizaciji repozitorija, vejah, PR-jih, commitih, Dockerju, CI/CD cevovodu, dokumentaciji, varnosti in projektnem vodenju.

## 3. Faza 1 - vzpostavitev okolij

V prvi fazi se pripravi osnova. Ustvari se GitHub repozitorij, dogovori se struktura map in pripravi `develop` veja. Vsak vecji del projekta dobi svojo mapo: `RAI/SmartLocker`, `ORV/cv-project`, `PJ/MobiApp`, `SA` in `docs`.

V tej fazi se pripravijo osnovna razvojna okolja. Za SmartLocker se preveri Node.js okolje, `package.json`, povezava z MongoDB in React frontend. Za ORV se preveri Python okolje, `requirements.txt`, FastAPI zagon in modeli. Za MobiApp se preveri Android Studio, Gradle Sync in lokalne nastavitve.

Poseben poudarek je na varnosti. Iz kode se odstranijo pravi kljuci. Direct4me API kljuc se prestavi v `local.properties`, backend skrivnosti pa v `.env`. V Git se commita samo `.env.example` in `local.properties.example`.

## 4. Faza 2 - implementacija in integracija

V drugi fazi se posamezni projekti povezejo v uporabno celoto. SmartLocker backend se poveze z bazo in frontend aplikacijo. ORV API se pripravi kot locena storitev, ki lahko obdeluje slike in preverja rezervacije. Mobilna aplikacija se uporablja kot locen odjemalec za QR odpiranje paketnika.

Dodajo se testi. Backend dobi Node teste, frontend dobi osnovni test konfiguracije, ORV dobi pytest teste za logiko rezervacij, Android aplikacija pa unit teste za QR parser.

Nato se pripravi Docker Compose. Celoten sistem se lahko postavi z enim ukazom: `docker compose up --build`. Docker Compose vkljucuje MongoDB, SmartLocker backend, React frontend in ORV face API.

Na koncu se pripravi GitHub Actions workflow. CI/CD ob vsakem PR-ju zazene teste, preveri build in izvede Docker build. Ob merge-u v main lahko slike potisne na DockerHub.

## 5. Razdelitev dela

| Podrocje | Rok | Jure |
|---|---|---|
| Git in PR | MobiApp, dokumentacija, CI/CD | SmartLocker, ORV, Docker |
| RAI | pomoc pri dokumentaciji | backend in frontend |
| ORV | pregled integracije | face API in testi |
| PJ | Android aplikacija, QR, varnost | pregled API povezav |
| SA | dokumentacija, GitHub Actions | Docker, DockerHub, Compose |

## 6. Jira taski

Jira taski so razdeljeni na fazo 1 in fazo 2. Vsak task ima odgovornega clana, branch in rezultat. Stanje taskov mora odrazati dejansko stanje na GitHubu. Ce je task zakljucen, mora obstajati commit ali PR, ki to potrjuje.

## 7. Git strategija

Uporablja se `main`, `develop` in `feature/*`. Vsak vecji feature gre v svojo vejo. PR mora vsebovati opis, testiranje in povezavo na Jira task. Vsak clan mora imeti vsaj dva PR-ja.

## 8. Docker strategija

Dockerizirani so SmartLocker backend, SmartLocker frontend in ORV face API. MongoDB uporablja uradno Docker sliko. Mobilna aplikacija se ne izvaja kot storitev, ker je Android odjemalec, vendar se njeni testi izvajajo v CI/CD.

## 9. CI/CD strategija

CI/CD workflow vsebuje jobe za backend teste, frontend teste in build, ORV teste, Android unit teste in Docker build. Za DockerHub so potrebni GitHub Secrets.

## 10. Varnost

Skrivnosti so odstranjene iz kode. `.env`, `local.properties` in pravi API kljuci se ne commitajo. Uporabljajo se primeri konfiguracij. JWT secret mora biti v produkciji zamenjan. MongoDB je v lokalnem Docker okolju dostopen za razvoj, v produkciji pa bi bil dostop omejen.

## 11. Testiranje

Testiranje se izvaja na vec nivojih: unit testi za logiko, rocno testiranje UI-ja, Docker build, preverjanje API endpointov in koncni scenarij uporabe. Pri mobilni aplikaciji se posebej preveri skeniranje QR kode, izlocanje ID-ja, API klic, predvajanje zvocnega zetona in zapis zgodovine.

## 12. Zakljucek

Terminski plan je osnova za nadaljnje delo in za sledenje napredku. Najpomembnejse je, da se vse spremembe izvajajo postopno, z locenimi vejami, PR-ji in Jira taski. Tako profesor vidi, da projekt ni nastal v enem dnevu, ampak je bil voden in razvit skozi cas.
