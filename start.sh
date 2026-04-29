#!/bin/bash
echo "🏋️ Peak Fit ishga tushirilmoqda..."

# Backend
cd "$(dirname "$0")/backend"
npm run dev &
BACKEND_PID=$!

# Frontend
cd "$(dirname "$0")/frontend"
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
