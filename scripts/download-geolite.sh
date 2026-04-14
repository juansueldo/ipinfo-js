#!/usr/bin/env bash
set -e

# Uso:
# ./download-geolite.sh <LICENSE_KEY> <DEST_DIR>

LICENSE_KEY=${1:-$MAXMIND_LICENSE_KEY}
DEST_DIR=${2:-./db}

if [ -z "$LICENSE_KEY" ]; then
  echo "❌ Necesitas MAXMIND_LICENSE_KEY"
  exit 1
fi

mkdir -p "$DEST_DIR"

TMPDIR=$(mktemp -d)

download_and_extract () {
  EDITION=$1
  OUTPUT_NAME=$2

  echo "⬇️ Descargando $EDITION..."

  URL="https://download.maxmind.com/app/geoip_download?edition_id=${EDITION}&license_key=${LICENSE_KEY}&suffix=tar.gz"

  FILE="$TMPDIR/${EDITION}.tar.gz"

  curl -L "$URL" -o "$FILE"

  tar -xzf "$FILE" -C "$TMPDIR"

  MMDB=$(find "$TMPDIR" -name "${OUTPUT_NAME}.mmdb" | head -n1)

  if [ -z "$MMDB" ]; then
    echo "❌ No se encontró ${OUTPUT_NAME}.mmdb"
    exit 2
  fi

  cp "$MMDB" "$DEST_DIR/${OUTPUT_NAME}.mmdb"

  echo "✅ ${OUTPUT_NAME}.mmdb guardado en $DEST_DIR"
}

# 🌍 City DB
download_and_extract "GeoLite2-City" "GeoLite2-City"

# 🛰️ ASN DB
download_and_extract "GeoLite2-ASN" "GeoLite2-ASN"

rm -rf "$TMPDIR"

echo "🎉 Descarga completa (City + ASN)"