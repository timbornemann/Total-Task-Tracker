# 🚀 Release-Prozess für Total-Task-Tracker

Dieser Guide erklärt, wie du neue Production- und Beta-Releases für Total-Task-Tracker erstellst.

## 📋 Übersicht

### Branch-Struktur
- **`main`** - Entwicklungs-Branch (Feature-Integration)
- **`beta`** - Beta-Testing Branch (stabile Features)
- **`production`** - Production-Branch (nur produktionsreife Features)

### Release-Typen
- **🧪 Beta Release** - Für Testing und Feedback
- **🚀 Production Release** - Stabile, produktionsreife Version

---

## 🧪 Beta Release erstellen

### Schritt 1: Feature-Entwicklung
```bash
# Feature-Branch erstellen
git checkout main
git pull origin main
git checkout -b feature/neue-funktion

# Entwicklung + Tests
git add .
git commit -m "feat: neue Funktion hinzugefügt"

# Pull Request zu main
git push -u origin feature/neue-funktion
gh pr create --base main --title "feat: neue Funktion"
```

### Schritt 2: Zu Beta mergen
```bash
# Nach Merge des Features zu main:
git checkout beta
git pull origin beta

# Pull Request von main zu beta erstellen
gh pr create --base beta --head main --title "feat: Beta Release - neue Features"
```

### Schritt 3: Beta Release wird automatisch erstellt
- 🤖 Beim Merge zu `beta` wird automatisch ein **Beta Pre-Release** erstellt
- 🐳 Docker Image wird gebaut: `ghcr.io/timbornemann/total-task-tracker:beta`
- 📋 Release Notes werden aus `.github/release-notes.beta.md` generiert

### Beta Release Beispiel:
- **Tag:** `v1.2.0-beta.1`
- **Docker:** `ghcr.io/timbornemann/total-task-tracker:beta-20241215123045-a1b2c3d`
- **Status:** Pre-Release (für Testing)

---

## 🚀 Production Release erstellen

### Schritt 1: Beta getestet und stabil
```bash
# Sicherstellen dass Beta stabil läuft
# Feedback gesammelt und Bugs gefixt
```

### Schritt 2: Versionierung vorbereiten
Die Versionierung erfolgt automatisch basierend auf:

#### Commit Messages (Conventional Commits):
- `feat:` → **Minor Version** (1.0.0 → 1.1.0)
- `fix:` → **Patch Version** (1.0.0 → 1.0.1)  
- `BREAKING CHANGE:` → **Major Version** (1.0.0 → 2.0.0)

#### PR Labels (überschreibt Commit Messages):
- Label `major` → Major Version
- Label `minor` → Minor Version
- Label `patch` → Patch Version

### Schritt 3: Production Release
```bash
# Von beta zu production mergen
git checkout production
git pull origin production

# Pull Request von beta zu production
gh pr create --base production --head beta --title "feat: Production Release v1.2.0" --label minor
```

### Schritt 4: Automatischer Release
Bei Merge zu `production`:
- 🤖 Neue Version wird automatisch berechnet
- 📝 `VERSION` Datei wird aktualisiert  
- 🏷️ Git Tag wird erstellt (z.B. `v1.2.0`)
- 📦 GitHub Release wird erstellt
- 🐳 Docker Images werden gebaut:
  - `ghcr.io/timbornemann/total-task-tracker:latest`
  - `ghcr.io/timbornemann/total-task-tracker:1.2.0`

---

## 🔧 Hotfixes (Kritische Fixes)

### Für kritische Bugs in Production:
```bash
# Hotfix-Branch von production
git checkout production
git pull origin production
git checkout -b hotfix/kritischer-bug

# Fix implementieren
git add .
git commit -m "fix: kritischer Bug behoben"

# Pull Request direkt zu production
git push -u origin hotfix/kritischer-bug
gh pr create --base production --title "hotfix: kritischer Bug" --label patch
```

### Nach Hotfix-Merge:
```bash
# Hotfix zu anderen Branches zurück mergen
git checkout main
git merge production

git checkout beta
git merge production
```

---

## 📊 Release-Übersicht

### Beta Releases
| Zweck | Testing, Feedback, experimentelle Features |
|-------|-------------------------------------------|
| **Trigger** | Merge zu `beta` Branch |
| **Docker Tag** | `beta`, `beta-YYYYMMDDHHMMSS-COMMIT` |
| **GitHub** | Pre-Release |
| **Stabilität** | ⚠️ Experimentell |

### Production Releases  
| Zweck | Stabile, produktionsreife Versionen |
|-------|-------------------------------------|
| **Trigger** | Merge zu `production` Branch |
| **Versionierung** | Semantic Versioning (1.2.3) |
| **Docker Tag** | `latest`, `1.2.3` |
| **GitHub** | Release (Latest) |
| **Stabilität** | ✅ Produktionsbereit |

---

## 🐳 Docker Images verwenden

### Production (empfohlen)
```bash
docker pull ghcr.io/timbornemann/total-task-tracker:latest
docker run -d --name total-task-tracker -p 3002:3002 \
  -v total-task-tracker-data:/app/server/data \
  ghcr.io/timbornemann/total-task-tracker:latest
```

### Spezifische Version
```bash
docker pull ghcr.io/timbornemann/total-task-tracker:1.2.0
docker run -d --name total-task-tracker -p 3002:3002 \
  -v total-task-tracker-data:/app/server/data \
  ghcr.io/timbornemann/total-task-tracker:1.2.0
```

### Beta Testing
```bash
docker pull ghcr.io/timbornemann/total-task-tracker:beta
docker run -d --name total-task-tracker-beta -p 3003:3002 \
  -v total-task-tracker-beta-data:/app/server/data \
  ghcr.io/timbornemann/total-task-tracker:beta
```

---

## ⚙️ Workflow-Konfiguration

### Automatische Workflows
- **`ci.yml`** - Tests, Linting, Build (alle Branches)
- **`release-on-merge.yml`** - Production Release (bei Merge zu production)
- **`release-on-merge-beta.yml`** - Beta Release (bei Merge zu beta)
- **`docker-build-release.yml`** - Docker Build (bei Allen Releases)
- **`docker-on-beta-release.yml`** - Docker Build (nur Beta Releases)

### Release Notes anpassen
- **Production:** Bearbeite `.github/release-notes.md`
- **Beta:** Bearbeite `.github/release-notes.beta.md`

### Manuelle Versionierung
Falls nötig, kannst du die `VERSION` Datei manuell anpassen:
```bash
echo "2.0.0" > VERSION
git add VERSION
git commit -m "chore: manual version bump to 2.0.0"
```

---

## 🔍 Troubleshooting

### Release schlägt fehl
1. **CI Tests prüfen** - Alle Tests müssen grün sein
2. **Branch Protection** - PRs müssen alle Required Checks bestehen  
3. **Permissions** - GitHub Actions braucht "Read and write permissions"
4. **VERSION Datei** - Muss gültiges Format haben (x.y.z)

### Docker Build Probleme
1. **Abhängigkeiten** - `npm ci` und `npm run build` müssen funktionieren
2. **Dockerfile** - Syntax und Pfade prüfen
3. **Registry Login** - GitHub Token muss gültig sein

### Beta/Production Konflikte
1. **Branch Sync** - Branches regelmäßig mergen
2. **Merge Konflikte** - Vor Release auflösen
3. **Testing** - Beta vor Production ausgiebig testen

---

## 📈 Best Practices

### ✅ Do's
- Features erst zu main, dann beta, dann production
- Ausgiebiges Testing in Beta-Phase
- Meaningful commit messages verwenden
- Release Notes vor Release aktualisieren
- Backup vor großen Updates

### ❌ Don'ts  
- Niemals direkt zu production pushen
- Keine ungetesteten Features in production
- Keine Breaking Changes ohne Major Version Bump
- Keine sensitive Daten in Release Notes

---

## 🎯 Checkliste für Releases

### Beta Release
- [ ] Feature entwickelt und getestet
- [ ] PR zu main gemerged
- [ ] Beta Release Notes aktualisiert
- [ ] PR zu beta erstellt und gemerged
- [ ] Beta Docker Image getestet
- [ ] Feedback von Beta-Testern gesammelt

### Production Release
- [ ] Beta ausgiebig getestet
- [ ] Alle kritischen Bugs behoben
- [ ] Production Release Notes aktualisiert
- [ ] Korrekte PR Labels gesetzt (major/minor/patch)
- [ ] PR zu production gemerged
- [ ] Production Docker Image verifiziert
- [ ] Release-Ankündigung vorbereitet

---

*📚 Für weitere Details siehe [Branching Strategy](branching-strategy.md)*
