#!/usr/bin/env bash
set -e

# Uso: ./download-geolite.sh <LICENSE_KEY> <DEST_PATH>
LICENSE_KEY=${1:-$MAXMIND_LICENSE_KEY}
DEST=${2:-./GeoLite2-City.mmdb}

if [ -z "$LICENSE_KEY" ]; then
  echo "Necesitas pasar MAXMIND_LICENSE_KEY como argumento o en env."
  exit 1
fi

TMPDIR=$(mktemp -d)
echo "Descargando GeoLite2 City..."
URL="https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-City&license_key=${LICENSE_KEY}&suffix=tar.gz"

curl -L "$URL" -o "$TMPDIR/geo.tar.gz"
tar -xzf "$TMPDIR/geo.tar.gz" -C "$TMPDIR"
# encontrar .mmdb
MMDB=$(find "$TMPDIR" -name "GeoLite2-City.mmdb" | head -n1)
if [ -z "$MMDB" ]; then
  echo "No se encontró el .mmdb en el tar. Revisa si tu licencia es válida."
  exit 2
fi

cp "$MMDB" "$DEST"
echo "GeoLite2-City.mmdb copiado a $DEST"
rm -rf "$TMPDIR"
