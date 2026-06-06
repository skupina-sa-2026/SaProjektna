# Vodenje Git dela korak po koraku

Ta vodič je napisan za vajin primer: že imata obstoječ GitHub repozitorij z `main` vejo, zdaj pa morata vanj pravilno dodati vse pripravljene projektne dele:

- `RAI/SmartLocker`
- `PJ/MobiApp`
- `ORV/cv-project`
- `SA/`
- `docs/`
- `docker-compose.yml`
- `.github/workflows/ci.yml`

Cilj ni samo, da projekt dela. Cilj je, da profesor vidi:

- da nista delala direktno na `main`,
- da imata `develop` vejo,
- da ima vsak član vsaj 2 PR-ja,
- da so funkcionalnosti dodane po ločenih feature vejah,
- da so commiti smiselno razdeljeni,
- da Jira taski ustrezajo branchom in PR-jem.

---

# 0. Pomembna pravila pred začetkom

## Pravilo 1: Nikoli ne delajta direktno na `main`

Narobe:

```bash
git checkout main
# spreminjaš datoteke
git add .
git commit -m "popravki"
git push
```

Pravilno:

```bash
git checkout develop
git pull
git checkout -b feature/ime-naloge
# spremeniš datoteke
git add pot/do/datotek
git commit -m "smiseln opis"
git push -u origin feature/ime-naloge
```

Potem na GitHubu odpreš Pull Request iz `feature/ime-naloge` v `develop`.

## Pravilo 2: Ne commitaj vsega z `git add .`, če ne veš točno, kaj dodajaš

Pred vsakim commitom vedno preveri:

```bash
git status
```

Če želiš videti spremembe v datotekah:

```bash
git diff
```

Če želiš dodati samo določeno mapo:

```bash
git add docs
```

Če želiš dodati samo eno datoteko:

```bash
git add docker-compose.yml
```

## Pravilo 3: Ne dodajaj `node_modules`, `build`, `.gradle`, `.idea`, `.env`

V Git ne smejo iti:

```text
node_modules/
build/
.gradle/
.idea/
.env
local.properties
```

V Git grejo samo primeri konfiguracije:

```text
.env.example
local.properties.example
```

## Pravilo 4: Ne kopiraj moje zunanje mape `SaProjektna_prilagojeno` v vaš repo

Ko razširiš ZIP, dobiš mapo:

```text
SaProjektna_prilagojeno/
```

V vaš GitHub repo ne kopiraš te cele mape kot podmapo.

Narobe:

```text
vas-repo/
  SaProjektna_prilagojeno/
    RAI/
    PJ/
    ORV/
```

Pravilno:

```text
vas-repo/
  RAI/
  PJ/
  ORV/
  SA/
  docs/
  docker-compose.yml
  .env.example
```

Torej kopiraš vsebino mape `SaProjektna_prilagojeno`, ne same mape.

---

# 1. Priprava računalnika

Odpri PowerShell ali Git Bash.

Najprej preveri, da imaš Git:

```bash
git --version
```

Če izpiše verzijo, je OK.

Nato izberi mapo, kjer želiš imeti projekt, na primer Desktop:

```bash
cd Desktop
```

Če si na Windowsu in imaš Desktop v slovenskem sistemu mogoče uporabi:

```bash
cd $HOME/Desktop
```

---

# 2. Kloniraj trenutni GitHub repozitorij

Na GitHubu odpri vajin repozitorij in kopiraj URL.

Primer:

```text
https://github.com/ime-organizacije/SaProjektna.git
```

Potem v terminalu:

```bash
git clone https://github.com/ime-organizacije/SaProjektna.git
cd SaProjektna
```

Preveri, da si res v repozitoriju:

```bash
git status
```

Pričakovan izpis:

```text
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

Če vidiš `working tree clean`, pomeni, da je lokalna kopija čista.

---

# 3. Naredi varnostno vejo iz trenutnega `main`

To narediš zato, da lahko vedno vrneš projekt nazaj, če kaj pokvariš.

```bash
git checkout main
git pull
```

Naredi backup branch:

```bash
git checkout -b backup/main-pred-preureditvijo
```

Pushaj backup na GitHub:

```bash
git push -u origin backup/main-pred-preureditvijo
```

Zdaj imaš na GitHubu varnostno vejo:

```text
backup/main-pred-preureditvijo
```

To pomeni, da se lahko vedno vrneš na staro stanje.

---

# 4. Ustvari `develop` iz trenutnega `main`

Vrni se na `main`:

```bash
git checkout main
```

Preveri, da je posodobljen:

```bash
git pull
```

Ustvari `develop` vejo:

```bash
git checkout -b develop
```

Pošlji `develop` na GitHub:

```bash
git push -u origin develop
```

Od zdaj naprej delata skoraj vse iz `develop`, ne iz `main`.

---

# 5. Kako uporabiti pripravljeni ZIP

Razširi ZIP, ki sem ti ga pripravil:

```text
SaProjektna_prilagojeno_na_vase_projekte.zip
```

Po razširitvi dobiš mapo:

```text
SaProjektna_prilagojeno/
```

Notri so mape:

```text
RAI/
PJ/
ORV/
SA/
docs/
.github/
docker-compose.yml
.env.example
README.md
.gitignore
```

Teh datotek ne kopiraj vseh naenkrat v en commit. Uporabi jih po PR-jih, kot je napisano spodaj.

---

# 6. Če ima trenutni `main` že stare mape

Če ima vajin trenutni repo že nekaj takega:

```text
ORV/
PJ/
RAI/
RPS/
```

jih ne briši direktno na `main`.

To se naredi na feature veji.

Najbolj varna logika je:

1. najprej naredi `develop`,
2. iz `develop` naredi feature branch,
3. na feature branchu preuredi mape,
4. naredi commit,
5. odpri PR v `develop`.

Če želiš odstraniti staro prazno mapo `RPS`, naredi to na feature branchu:

```bash
git rm -r RPS
```

Potem commit:

```bash
git commit -m "SA: odstranjena neuporabljena mapa RPS"
```

Če imaš staro mapo `PJ`, ampak boš zdaj uporabil pripravljeno `PJ/MobiApp`, potem ne briši na pamet. Najprej preveri:

```bash
ls PJ
```

Če je stara mapa prazna ali napačna, jo lahko na feature veji zamenjaš.

---

# 7. PR 1 — Rok: osnovna struktura, dokumentacija in varnostni backup

Ta PR naj naredi Rok. Namen PR-ja je, da repozitorij dobi osnovno strukturo za Sistemsko administracijo.

## 7.1 Začni iz `develop`

```bash
git checkout develop
git pull
```

Naredi novo vejo:

```bash
git checkout -b feature/SA-osnovna-struktura
```

## 7.2 Kopiraj datoteke iz pripravljenega ZIP-a

Iz mape `SaProjektna_prilagojeno/` v vajin repo kopiraj:

```text
README.md
.gitignore
.env.example
docs/
SA/
.github/pull_request_template.md
```

Ne kopiraj še:

```text
RAI/
PJ/
ORV/
docker-compose.yml
.github/workflows/ci.yml
```

To pride v kasnejših PR-jih.

## 7.3 Preveri stanje

```bash
git status
```

Moral bi videti nekaj podobnega:

```text
Untracked files:
  README.md
  .gitignore
  .env.example
  docs/
  SA/
  .github/
```

## 7.4 Commit 1: osnovne datoteke

```bash
git add README.md .gitignore .env.example
git commit -m "SA: dodana osnovna struktura repozitorija"
```

## 7.5 Commit 2: dokumentacija

```bash
git add docs
git commit -m "SA: dodana dokumentacija projekta"
```

## 7.6 Commit 3: skripte in PR template

```bash
git add SA .github/pull_request_template.md
git commit -m "SA: dodane skripte in predloga za pull request"
```

## 7.7 Push veje

```bash
git push -u origin feature/SA-osnovna-struktura
```

## 7.8 Odpri PR

Na GitHubu se pojavi gumb:

```text
Compare & pull request
```

Nastavi:

```text
base: develop
compare: feature/SA-osnovna-struktura
```

Naslov PR-ja:

```text
SA: osnovna struktura repozitorija in dokumentacija
```

Opis PR-ja:

```markdown
## Kaj je bilo narejeno
- Dodana osnovna struktura repozitorija.
- Dodana dokumentacija projekta.
- Dodana PR predloga in skripte za zagon.

## Zakaj je bilo narejeno
Zahteva predmeta Sistemska administracija je, da je projekt urejen po predmetih, dokumentiran in voden preko Git vej ter PR-jev.

## Kako je bilo testirano
- Preverjen `git status`.
- Preverjena struktura map.
- Preverjeno, da ni dodana `.env` datoteka.

## Jira task
SA-1, SA-2
```

Po odprtju PR-ja ga drugi član pregleda in klikne:

```text
Merge pull request
```

Potem lokalno posodobi `develop`:

```bash
git checkout develop
git pull
```

---

# 8. PR 2 — Jure: SmartLocker spletna aplikacija

Ta PR naj naredi Jure. Namen je dodati SmartLocker backend in frontend.

## 8.1 Začni iz svežega `develop`

```bash
git checkout develop
git pull
```

Naredi vejo:

```bash
git checkout -b feature/RAI-smartlocker
```

## 8.2 Kopiraj SmartLocker

Iz pripravljenega ZIP-a kopiraj:

```text
RAI/SmartLocker/
```

v vajin repo, da dobiš:

```text
SaProjektna/
  RAI/
    SmartLocker/
```

## 8.3 Preveri, kaj bo šlo v Git

```bash
git status
```

Če vidiš `node_modules`, tega ne smeš commitati.

Če se pojavi, ga odstrani iz staginga:

```bash
git restore --staged RAI/SmartLocker/node_modules
```

Če mapa obstaja, jo lahko izbrišeš lokalno:

```bash
rm -rf RAI/SmartLocker/node_modules
rm -rf RAI/SmartLocker/frontend/node_modules
```

Na Windows PowerShell lahko uporabiš:

```powershell
Remove-Item -Recurse -Force RAI/SmartLocker/node_modules
Remove-Item -Recurse -Force RAI/SmartLocker/frontend/node_modules
```

## 8.4 Commit 1: backend

```bash
git add RAI/SmartLocker/server.js RAI/SmartLocker/src RAI/SmartLocker/package.json RAI/SmartLocker/package-lock.json RAI/SmartLocker/README.md
git commit -m "RAI: dodan SmartLocker backend"
```

## 8.5 Commit 2: frontend

```bash
git add RAI/SmartLocker/frontend
git commit -m "RAI: dodan SmartLocker frontend"
```

## 8.6 Commit 3: testi in validacija

```bash
git add RAI/SmartLocker/tests RAI/SmartLocker/src/utils RAI/SmartLocker/frontend/tests
git commit -m "RAI: dodani osnovni testi in validacija"
```

## 8.7 Commit 4: Dockerfile-i

```bash
git add RAI/SmartLocker/Dockerfile RAI/SmartLocker/frontend/Dockerfile
git commit -m "SA: dodana Dockerfile za SmartLocker backend in frontend"
```

## 8.8 Push in PR

```bash
git push -u origin feature/RAI-smartlocker
```

PR:

```text
base: develop
compare: feature/RAI-smartlocker
```

Naslov:

```text
RAI: dodana spletna aplikacija SmartLocker
```

Opis:

```markdown
## Kaj je bilo narejeno
- Dodan SmartLocker backend.
- Dodan React frontend.
- Dodani osnovni testi.
- Dodana Dockerfile-a za backend in frontend.

## Kako je bilo testirano
- Backend: `npm install` in `npm test`.
- Frontend: `npm install` in `npm run build`.

## Jira task
RAI-1, RAI-2, SA-4
```

---

# 9. PR 3 — Rok: MobiApp Android aplikacija

Ta PR naj naredi Rok. Namen je dodati mobilno aplikacijo in popravke, ki sem jih pripravil.

## 9.1 Začni iz `develop`

```bash
git checkout develop
git pull
```

Naredi vejo:

```bash
git checkout -b feature/PJ-mobiapp
```

## 9.2 Kopiraj MobiApp

Iz pripravljenega ZIP-a kopiraj:

```text
PJ/MobiApp/
```

v vajin repo, da dobiš:

```text
SaProjektna/
  PJ/
    MobiApp/
```

## 9.3 Preveri, da ni notranjega `.git`

Zelo pomembno:

```bash
ls PJ/MobiApp/.git
```

Če mapa obstaja, jo izbriši:

```bash
rm -rf PJ/MobiApp/.git
```

Na Windows PowerShell:

```powershell
Remove-Item -Recurse -Force PJ/MobiApp/.git
```

## 9.4 Preveri, da ni conflict markerjev

Zaženi:

```bash
grep -R "<<<<<<<\|=======\|>>>>>>>" PJ/MobiApp/app/src || true
```

Če Git Bash ni na voljo, lahko v VS Code uporabiš iskanje po celotnem projektu in poiščeš:

```text
<<<<<<<
=======
>>>>>>>
```

Če nič ne najde, je OK.

## 9.5 Commit 1: osnovna mobilna aplikacija

```bash
git add PJ/MobiApp/settings.gradle.kts PJ/MobiApp/build.gradle.kts PJ/MobiApp/gradle.properties PJ/MobiApp/gradlew PJ/MobiApp/gradlew.bat PJ/MobiApp/gradle PJ/MobiApp/app/build.gradle.kts PJ/MobiApp/app/src/main PJ/MobiApp/app/.gitignore PJ/MobiApp/.gitignore
git commit -m "PJ: dodana mobilna aplikacija MobiApp"
```

Če kakšna od teh datotek ne obstaja, jo Git preskoči z napako. V tem primeru uporabi bolj enostavno:

```bash
git add PJ/MobiApp
git commit -m "PJ: dodana mobilna aplikacija MobiApp"
```

Ampak pred tem preveri, da ne dodajaš `.gradle`, `build` ali `.idea`.

## 9.6 Commit 2: odstranjen API key

```bash
git add PJ/MobiApp/app/src/main/java/com/example/mobiapp/ApiService.kt PJ/MobiApp/local.properties.example
git commit -m "SA: odstranjen hardcoded Direct4me API kljuc"
```

## 9.7 Commit 3: QR parser

```bash
git add PJ/MobiApp/app/src/main/java/com/example/mobiapp/QrParser.kt
git commit -m "PJ: dodan QR parser za podatke paketnika"
```

## 9.8 Commit 4: testi

```bash
git add PJ/MobiApp/app/src/test/java/com/example/mobiapp/QrParserTest.kt
git commit -m "PJ: dodani testi za QR parser"
```

## 9.9 Push in PR

```bash
git push -u origin feature/PJ-mobiapp
```

PR:

```text
base: develop
compare: feature/PJ-mobiapp
```

Naslov:

```text
PJ: dodana mobilna aplikacija za QR odpiranje
```

Opis:

```markdown
## Kaj je bilo narejeno
- Dodana Android aplikacija MobiApp.
- Odstranjen hardcoded Direct4me API ključ.
- Dodan `local.properties.example`.
- Dodan QR parser.
- Dodani testi za QR parser.

## Kako je bilo testirano
- Projekt se odpre v Android Studiu.
- Preverjeno, da ni merge conflict markerjev.
- Dodani unit testi za QR parser.

## Jira task
PJ-1, PJ-2, SA-5
```

---

# 10. PR 4 — Jure: ORV cv-project face recognition API

Ta PR naj naredi Jure.

## 10.1 Začni iz `develop`

```bash
git checkout develop
git pull
```

Naredi vejo:

```bash
git checkout -b feature/ORV-face-api
```

## 10.2 Kopiraj cv-project

Iz pripravljenega ZIP-a kopiraj:

```text
ORV/cv-project/
```

v vajin repo, da dobiš:

```text
SaProjektna/
  ORV/
    cv-project/
```

## 10.3 Preveri velike ali nepotrebne datoteke

Pred commitom:

```bash
git status
```

Če vidiš velike začasne mape, jih ne dodajaj:

```text
__pycache__/
.venv/
venv/
```

Če obstajajo, jih izbriši lokalno:

```bash
rm -rf ORV/cv-project/__pycache__
rm -rf ORV/cv-project/.venv
rm -rf ORV/cv-project/venv
```

## 10.4 Commit 1: API koda

```bash
git add ORV/cv-project/api ORV/cv-project/model ORV/cv-project/scripts ORV/cv-project/requirements.txt ORV/cv-project/README.md
git commit -m "ORV: dodan face recognition API"
```

Če katera mapa ne obstaja, uporabi:

```bash
git add ORV/cv-project
git commit -m "ORV: dodan face recognition API"
```

Pred tem še enkrat preveri `git status`, da ne dodajaš nepotrebnih map.

## 10.5 Commit 2: Docker zagon

```bash
git add ORV/cv-project/Dockerfile ORV/cv-project/start.bat ORV/cv-project/start.sh
git commit -m "SA: dodan Docker zagon za ORV API"
```

## 10.6 Commit 3: testi

```bash
git add ORV/cv-project/tests
git commit -m "ORV: dodani osnovni testi za API"
```

Če `tests` ne obstaja, ga za zdaj preskoči, ampak potem mora biti CI/CD prilagojen.

## 10.7 Push in PR

```bash
git push -u origin feature/ORV-face-api
```

PR:

```text
base: develop
compare: feature/ORV-face-api
```

Naslov:

```text
ORV: dodan face recognition API
```

Opis:

```markdown
## Kaj je bilo narejeno
- Dodan cv-project za prepoznavo obraza.
- Dodan Dockerfile oziroma zagon API-ja.
- Dodani osnovni testi.

## Kako je bilo testirano
- Preverjen zagon API-ja.
- Preverjeni testi, če so prisotni.

## Jira task
ORV-1, ORV-2, SA-4
```

---

# 11. PR 5 — Jure: Docker Compose za celoten sistem

Ta PR poveže projekte v en sistem.

## 11.1 Začni iz `develop`

```bash
git checkout develop
git pull
```

Naredi vejo:

```bash
git checkout -b feature/SA-docker-compose
```

## 11.2 Kopiraj Docker datoteke

Iz pripravljenega ZIP-a kopiraj:

```text
docker-compose.yml
.env.example
```

Če `.env.example` že obstaja iz PR 1, ga lahko prepišeš s posodobljeno verzijo.

## 11.3 Commit 1: Docker Compose

```bash
git add docker-compose.yml
git commit -m "SA: dodan Docker Compose za celoten sistem"
```

## 11.4 Commit 2: env primer

```bash
git add .env.example
git commit -m "SA: posodobljena skupna env konfiguracija"
```

## 11.5 Test lokalno

Ustvari pravo `.env` datoteko iz primera:

```bash
cp .env.example .env
```

Na Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Zaženi:

```bash
docker compose up --build
```

Če se ne zažene vse, ni konec sveta, ampak si zapiši, kaj manjka. Za profesorja je pomembno, da imata pripravljeno strukturo in realen poskus kontejnerizacije.

## 11.6 Push in PR

```bash
git push -u origin feature/SA-docker-compose
```

PR:

```text
base: develop
compare: feature/SA-docker-compose
```

Naslov:

```text
SA: dodan Docker Compose za zagon sistema
```

Opis:

```markdown
## Kaj je bilo narejeno
- Dodan `docker-compose.yml`.
- Dodana skupna `.env.example` konfiguracija.
- Povezani so SmartLocker backend, frontend, MongoDB in ORV API.

## Kako je bilo testirano
- Lokalni poskus z `docker compose up --build`.

## Jira task
SA-6
```

---

# 12. PR 6 — Rok: CI/CD GitHub Actions

Ta PR doda avtomatsko preverjanje na GitHubu.

## 12.1 Začni iz `develop`

```bash
git checkout develop
git pull
```

Naredi vejo:

```bash
git checkout -b feature/SA-ci-cd
```

## 12.2 Kopiraj workflow

Iz pripravljenega ZIP-a kopiraj:

```text
.github/workflows/ci.yml
```

v vajin repo:

```text
.github/workflows/ci.yml
```

## 12.3 Commit 1: CI/CD

```bash
git add .github/workflows/ci.yml
git commit -m "SA: dodan GitHub Actions CI/CD workflow"
```

## 12.4 Push in PR

```bash
git push -u origin feature/SA-ci-cd
```

PR:

```text
base: develop
compare: feature/SA-ci-cd
```

Naslov:

```text
SA: dodan CI/CD workflow
```

Opis:

```markdown
## Kaj je bilo narejeno
- Dodan GitHub Actions workflow.
- Dodano preverjanje backend testov.
- Dodano preverjanje frontend builda.
- Dodano preverjanje ORV API testov.
- Dodan Docker build.

## Kako je bilo testirano
- Workflow se zažene ob PR-ju.
- Preverjeno v zavihku Actions na GitHubu.

## Jira task
SA-7
```

---

# 13. Končni PR iz `develop` v `main`

Ko so vsi feature PR-ji mergani v `develop`, naredita še končni PR:

```text
develop -> main
```

Na GitHubu:

1. odpri Pull requests,
2. New pull request,
3. base naj bo `main`,
4. compare naj bo `develop`,
5. Create pull request.

Naslov:

```text
Končna integracija projektnih funkcionalnosti
```

Opis:

```markdown
## Kaj je bilo narejeno
- Združeni so projektni deli RAI, PJ in ORV.
- Dodana je dokumentacija za namestitev in primere uporabe.
- Dodan je terminski plan.
- Dodan je Docker Compose.
- Dodan je CI/CD workflow.

## Kako je bilo testirano
- Preverjeni posamezni PR-ji.
- Preverjen Docker Compose.
- Preverjen GitHub Actions workflow.

## Jira taski
SA-1 do SA-8, RAI-1, PJ-1, ORV-1
```

---

# 14. Kako rešiti pogoste težave

## Težava: `fatal: a branch named develop already exists`

To pomeni, da `develop` že obstaja lokalno.

Uporabi:

```bash
git checkout develop
git pull
```

## Težava: `Your local changes would be overwritten`

Imaš lokalne spremembe, ki še niso commitane.

Preveri:

```bash
git status
```

Če jih želiš shraniti v commit:

```bash
git add pot/do/datoteke
git commit -m "opis spremembe"
```

Če jih želiš začasno umakniti:

```bash
git stash
```

Potem:

```bash
git pull
```

In vrni spremembe:

```bash
git stash pop
```

## Težava: pomotoma sem commit naredil na `main`

Če še nisi pushal:

```bash
git branch feature/popravek-iz-main
```

Potem vrni `main` en commit nazaj:

```bash
git checkout main
git reset --hard HEAD~1
```

Nato pojdi na feature vejo:

```bash
git checkout feature/popravek-iz-main
```

Push:

```bash
git push -u origin feature/popravek-iz-main
```

Če si že pushal na GitHub, ne delaj `reset --hard` brez dogovora. Takrat raje naredi nov PR, ki popravi stanje.

## Težava: commit sem naredil z napačnim sporočilom

Če je to zadnji commit in še ni pushan:

```bash
git commit --amend -m "Novo pravilno sporocilo"
```

## Težava: dodal sem `.env`

Če še nisi commit-al:

```bash
git restore --staged .env
git rm --cached .env
```

Dodaj v `.gitignore`:

```text
.env
```

Commit:

```bash
git add .gitignore
git commit -m "SA: dodan env v gitignore"
```

Če je bil pravi ključ že pushan na GitHub, ga moraš zamenjati oziroma regenerirati.

## Težava: Git pravi `nothing to commit`

To pomeni eno od dveh stvari:

1. nisi nič spremenil,
2. spremembe so že commitane.

Preveri:

```bash
git status
```

Preveri zadnje commite:

```bash
git log --oneline --decorate -5
```

---

# 15. Kako naj si razdelita PR-je, da oba dobita točke

Minimalno naj bo tako:

## Rok

```text
PR 1: feature/SA-osnovna-struktura
PR 3: feature/PJ-mobiapp
PR 6: feature/SA-ci-cd
```

## Jure

```text
PR 2: feature/RAI-smartlocker
PR 4: feature/ORV-face-api
PR 5: feature/SA-docker-compose
```

Tako ima vsak vsaj 2 PR-ja.

---

# 16. Predlagani commit plan

## Rok commiti

```text
SA: dodana osnovna struktura repozitorija
SA: dodana dokumentacija projekta
SA: dodane skripte in predloga za pull request
PJ: dodana mobilna aplikacija MobiApp
SA: odstranjen hardcoded Direct4me API kljuc
PJ: dodan QR parser za podatke paketnika
PJ: dodani testi za QR parser
SA: dodan GitHub Actions CI/CD workflow
```

## Jure commiti

```text
RAI: dodan SmartLocker backend
RAI: dodan SmartLocker frontend
RAI: dodani osnovni testi in validacija
SA: dodana Dockerfile za SmartLocker backend in frontend
ORV: dodan face recognition API
SA: dodan Docker zagon za ORV API
ORV: dodani osnovni testi za API
SA: dodan Docker Compose za celoten sistem
SA: posodobljena skupna env konfiguracija
```

Če hočeta povečati število commitov, lahko dokumentacijo razdelita še bolj:

```text
SA: dodana navodila za namestitev
SA: dodani primeri uporabe
SA: dodan terminski plan
SA: dodana varnostna dokumentacija
SA: dodana Jira dokumentacija
```

Pomembno: commiti naj bodo realni in povezani z dejanskimi spremembami.

---

# 17. Kaj pokazati profesorju

Na GitHubu pokažita:

1. `main` vejo,
2. `develop` vejo,
3. seznam PR-jev,
4. da ima Rok svoje PR-je,
5. da ima Jure svoje PR-je,
6. commit zgodovino,
7. `docs/` dokumentacijo,
8. `docker-compose.yml`,
9. `.github/workflows/ci.yml`,
10. Jira board s taski.

Najbolj pomembni dokazi:

```text
Pull requests
Branches
Commits
Actions
Dockerfile-i
Dokumentacija
Jira taski
```

---

# 18. Najkrajši možen začetek, če si čisto izgubljen

Če ne veš, kje začeti, naredi samo to:

```bash
cd Desktop
git clone https://github.com/ime-organizacije/SaProjektna.git
cd SaProjektna
git checkout main
git pull
git checkout -b backup/main-pred-preureditvijo
git push -u origin backup/main-pred-preureditvijo
git checkout main
git checkout -b develop
git push -u origin develop
git checkout -b feature/SA-osnovna-struktura
```

Potem iz mojega ZIP-a kopiraj v vaš repo samo:

```text
README.md
.gitignore
.env.example
docs/
SA/
.github/pull_request_template.md
```

Nato:

```bash
git status
git add README.md .gitignore .env.example
git commit -m "SA: dodana osnovna struktura repozitorija"
git add docs
git commit -m "SA: dodana dokumentacija projekta"
git add SA .github/pull_request_template.md
git commit -m "SA: dodane skripte in predloga za pull request"
git push -u origin feature/SA-osnovna-struktura
```

Potem odpri PR na GitHubu:

```text
feature/SA-osnovna-struktura -> develop
```

Ko je ta PR narejen, si uspešno začel pravilno Git vodenje.
