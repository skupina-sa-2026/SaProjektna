# 📦 Pametni paketnik – Airbnb Smart Locker

## 1. 🧠 Idejni načrt

Projekt **Airbnb Smart Locker** predstavlja pametni paketnik, ki omogoča varno in brezstično predajo ključev med lastnikom stanovanja (hostom) in gostom.

Sistem je namenjen predvsem uporabi pri kratkoročnem oddajanju stanovanj (npr. Airbnb), kjer lastnik ne želi osebno predajati ključev. Gost dobi časovno omejen dostop do paketnika, v katerem se nahajajo ključi ali kartica za vstop v stanovanje.

### 🔑 Glavne funkcionalnosti:

* Odklepanje paketnika preko spletne aplikacije
* Časovno omejen dostop (glede na rezervacijo)
* Beleženje vseh odklepov (logi)
* Upravljanje paketnikov in rezervacij
* Generiranje dostopnih kod za goste

---

## 2. 👥 Uporabniške vloge

### 🧑 Host (lastnik)

* upravlja paketnike
* ustvarja rezervacije
* vidi zgodovino dostopov

### 🧳 Guest (gost)

* prejme dostop do paketnika
* odklene paketnik v dovoljenem času

---

## 3. 📖 User Stories

### 🔐 Avtentikacija

* Kot uporabnik se želim registrirati v sistem
* Kot uporabnik se želim prijaviti v sistem

### 🏠 Upravljanje paketnikov

* Kot host želim dodati nov paketnik
* Kot host želim odstraniti paketnik
* Kot host želim videti seznam svojih paketnikov

### 📅 Rezervacije

* Kot host želim ustvariti rezervacijo za gosta
* Kot host želim določiti časovni interval dostopa
* Kot guest želim imeti dostop samo v času moje rezervacije

### 🔓 Odklepanje

* Kot guest želim odkleniti paketnik s telefonom
* Kot sistem želim preveriti veljavnost dostopa pred odklepom
* Kot sistem želim zavrniti dostop, če pogoji niso izpolnjeni

### 📊 Beleženje

* Kot sistem želim beležiti vsak poskus odklepa
* Kot host želim videti zgodovino odklepov

---

## 4. 🧩 Razdelitev dela

Projekt izvajata:

* **Rok Kogovšek**
* **Jure Vidmar**

### 🔧 Rok Kogovšek

* razvoj backend sistema (REST API)
* podatkovni model in baza
* implementacija:

  * prijave uporabnika
  * upravljanja paketnikov
  * beleženja logov

### 🎨 Jure Vidmar

* razvoj frontend portala
* implementacija uporabniškega vmesnika
* funkcionalnosti:

  * prijava uporabnika
  * prikaz paketnikov
  * prikaz rezervacij in logov

### 🤝 Skupno delo

* načrtovanje sistema
* testiranje aplikacije
* priprava predstavitve
* integracija frontend + backend

---

## 5. ⏱️ Interni roki

| Faza                      | Rok         |
| ------------------------- | ----------- |
| Idejni načrt              | 19. 4. 2026 |
| Backend (API)             | 10. 5. 2026 |
| Frontend portal           | 24. 5. 2026 |
| Integracija in testiranje | 28. 5. 2026 |
| Priprava predstavitve     | 5. 6. 2026  |

---

## 6. 🎯 Cilj projekta

Cilj projekta je razviti delujoč sistem, ki omogoča:

* varno upravljanje dostopa do paketnika
* avtomatsko dodeljevanje dostopa glede na rezervacije
* enostavno uporabo za goste in lastnike

Projekt vključuje razvoj:

* zalednega sistema (backend)
* spletnega uporabniškega portala (frontend)
* podatkovne baze

---
