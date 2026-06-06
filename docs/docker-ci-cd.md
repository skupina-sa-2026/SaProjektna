# Docker in CI/CD

## Docker

Projekt se zazene iz korena z ukazom:

```bash
docker compose up --build
```

Docker Compose postavi:

- `mongo` - podatkovna baza,
- `smartlocker-api` - Node/Express backend,
- `smartlocker-frontend` - React frontend,
- `face-api` - FastAPI ORV servis.

Mobilna aplikacija se ne zaganja v Dockerju, ker je namenjena Android napravi, vendar se njeni unit testi izvajajo v CI/CD cevovodu.

## CI/CD

Workflow je v:

```text
.github/workflows/ci.yml
```

Izvaja:

1. backend teste,
2. frontend teste in build,
3. ORV Python teste,
4. Android unit teste,
5. Docker Compose build,
6. push Docker slik na DockerHub ob merge-u v `main`.

## GitHub Secrets

V GitHub repozitoriju dodajte:

```text
DOCKERHUB_USERNAME
DOCKERHUB_TOKEN
DIRECT4ME_API_KEY
```

Pravi kljuci se ne zapisujejo v kodo.
