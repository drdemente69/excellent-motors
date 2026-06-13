#!/bin/sh
set -e

echo "⏳  Waiting for the database…"
npx prisma migrate deploy

# Seed only if the catalogue is empty (first boot).
PRODUCTS=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.product.count().then(n=>{console.log(n);return p.\$disconnect()}).catch(()=>{console.log(0)})" 2>/dev/null || echo 0)
if [ "$PRODUCTS" = "0" ]; then
  echo "🌱  Empty database — seeding demo data…"
  npm run placeholders || true
  npm run db:seed || true
fi

echo "🚀  Starting Excellent Motors…"
exec "$@"
