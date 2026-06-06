# Git navodila za projekt

## Veje

Uporabljamo naslednjo strategijo:

- `main` - stabilna koncna verzija,
- `develop` - skupna razvojna veja,
- `feature/*` - veja za posamezno funkcionalnost,
- `hotfix/*` - nujni popravki.

## Pravilo

Vsaka vecja naloga gre vedno v svojo vejo. Direktno commitanje v `main` ali `develop` ni dovoljeno.

## Primer dela

```bash
git checkout develop
git pull
git checkout -b feature/SA-docker-compose
```

Po spremembah:

```bash
git add .
git commit -m "SA: dodan Docker Compose za celoten sistem"
git push -u origin feature/SA-docker-compose
```

Nato se na GitHubu odpre Pull Request v `develop`.

## Obvezno za vsakega clana

Vsak clan mora imeti:

- vsaj 2 Pull Requesta,
- cim vec smiselnih commitov,
- commite skozi daljse casovno obdobje,
- lastne Jira naloge,
- jasno povezavo med taskom, branchom in PR-jem.
