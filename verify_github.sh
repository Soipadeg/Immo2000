#!/bin/bash
# 🔍 Vérification GitHub

echo "================================"
echo "🔍 VÉRIFICATION GITHUB"
echo "================================"
echo ""

# 1. Git version
echo "1️⃣  Git Version:"
git --version
echo ""

# 2. Git Config
echo "2️⃣  Git Config:"
echo "   Local:"
git config --local user.name 2>/dev/null || echo "   ❌ user.name non configuré"
git config --local user.email 2>/dev/null || echo "   ❌ user.email non configuré"
echo ""
echo "   Global:"
git config --global user.name 2>/dev/null || echo "   ❌ user.name global non configuré"
git config --global user.email 2>/dev/null || echo "   ❌ user.email global non configuré"
echo ""

# 3. Remote
echo "3️⃣  Remotes Git:"
git remote -v 2>/dev/null || echo "   ❌ Pas de remote configurée"
echo ""

# 4. SSH Connection
echo "4️⃣  Connexion SSH GitHub:"
ssh -T git@github.com 2>&1 | grep -q "successfully authenticated" && echo "   ✅ Connecté à GitHub via SSH" || echo "   ⚠️  Problème SSH (voir détails ci-dessus)"
echo ""

# 5. HTTPS Connection
echo "5️⃣  Credentials HTTPS (optionnel):"
git credential-osxkeychain get <<< "host=github.com" 2>/dev/null && echo "   ✅ Credentials stockés (macOS)" || echo "   ℹ️  Pas de credentials trouvés (peut utiliser SSH)"
echo ""

# 6. Test Push Dry-Run
echo "6️⃣  Test Push (dry-run):"
git fetch --dry-run 2>&1 | head -5
if [ $? -eq 0 ]; then
    echo "   ✅ Connexion à la remote OK"
else
    echo "   ❌ Problème de connexion à la remote"
fi
echo ""

echo "================================"
echo "✅ Vérification Complétée"
echo "================================"
