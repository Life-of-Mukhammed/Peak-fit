#!/bin/bash
echo "🏋️ KiGo ishga tushirilmoqda..."

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Backend
cd "$ROOT/backend"
npm run dev &
BACKEND_PID=$!

# Frontend
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo "✅ Backend: http://localhost:5000"
echo "✅ Frontend: http://localhost:3000"
echo ""
echo "Birinchi marta? http://localhost:3000 ochib 'Admin yaratish' tugmasini bosing"
echo "Login: admin | Parol: admin123"
echo ""
echo "Toxtatish uchun Ctrl+C bosing"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
