#!/usr/bin/env bash
#
# Compila o APK localmente, com a MESMA assinatura que o GitHub Actions usa.
#
#   DEBUG_KEYSTORE_PASSPHRASE=... npm run apk
#
# Porque é que isto é um script e não "./gradlew assembleDebug":
#
# O Android trata dois APKs assinados com chaves diferentes como aplicações
# diferentes. Se compilares localmente com a keystore de debug que o Gradle
# inventa na tua máquina, o APK resultante NÃO instala por cima do que veio do
# GitHub — falha com "App não instalada", ou pior, o telemóvel fica calado com a
# versão antiga. Este script fixa a mesma keystore que o CI fixa, e verifica a
# impressão digital no fim, que é a única coisa que apanha o erro antes do
# telemóvel.
#
# Precisas de: JDK 21, Android SDK com platforms;android-36 e build-tools;36.0.0,
# e ANDROID_HOME (ou ANDROID_SDK_ROOT) apontado para ele.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -z "${DEBUG_KEYSTORE_PASSPHRASE:-}" ]; then
  echo "erro: DEBUG_KEYSTORE_PASSPHRASE não está definido." >&2
  echo "      É o mesmo segredo que está em Settings > Secrets and variables > Actions." >&2
  echo "      Sem ele o APK seria assinado com uma chave nova e não instalaria por cima." >&2
  exit 1
fi

export JIANYING_DEBUG_KEYSTORE="$PWD/ci/debug.keystore"

echo "== bundle web"
npx vite build

echo "== projeto android"
[ -d android ] || npx cap add android
npx cap sync android

# Capacitor não declara signingConfig para debug, por isso o AGP escolhe um
# caminho sozinho — e não escolhe ~/.android/debug.keystore. Um caminho
# explícito tira o palpite. Groovy aceita vários blocos android {}, e o guard
# evita duplicar isto em cada corrida.
if ! grep -q "JIANYING_DEBUG_KEYSTORE" android/app/build.gradle; then
  cat >> android/app/build.gradle <<'GRADLE'

android {
    signingConfigs {
        debug {
            storeFile file(System.getenv("JIANYING_DEBUG_KEYSTORE"))
            storePassword "android"
            keyAlias "androiddebugkey"
            keyPassword "android"
        }
    }
}
GRADLE
fi

echo "== keystore estável"
openssl enc -d -aes-256-cbc -pbkdf2 -iter 200000 \
  -in ci/debug.keystore.enc \
  -out "$JIANYING_DEBUG_KEYSTORE" \
  -pass "pass:$DEBUG_KEYSTORE_PASSPHRASE"

echo "== gradle"
(cd android && ./gradlew --no-daemon assembleDebug)

echo "== assinatura"
EXPECTED=$(keytool -list -v -keystore "$JIANYING_DEBUG_KEYSTORE" \
  -storepass android -alias androiddebugkey | sed -n 's/.*SHA256: //p' | head -1)
ACTUAL=$(python3 ci/apk_cert_fingerprint.py android/app/build/outputs/apk/debug/app-debug.apk)
if [ "$EXPECTED" != "$ACTUAL" ]; then
  echo "erro: o APK não foi assinado com a keystore estável." >&2
  echo "      esperado: $EXPECTED" >&2
  echo "      no APK:   $ACTUAL" >&2
  exit 1
fi

echo
echo "APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo "Instalar com o telemóvel ligado por USB:  npm run install:phone"
