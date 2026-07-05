@echo off
title AlloPanier - Demarrage
color 0A

echo.
echo  ===================================================
echo    ALLOPANIER - Demarrage de la plateforme
echo  ===================================================
echo.

cd /d "c:\Users\DJAGOZ\Desktop\alopanier"

echo [0/3] Arret des anciens processus...
taskkill /f /im node.exe > nul 2>&1
timeout /t 2 /nobreak > nul
echo  OK

echo.
echo [1/3] Verification de PostgreSQL...
sc query "postgresql-x64-18" | findstr "RUNNING" > nul
if %errorlevel% neq 0 (
    echo  Demarrage de PostgreSQL...
    net start postgresql-x64-18
    timeout /t 4 /nobreak > nul
) else (
    echo  PostgreSQL OK
)

echo.
echo [2/3] Demarrage du backend (port 5000)...
start "AlloPanier - Backend" cmd /k "cd /d c:\Users\DJAGOZ\Desktop\alopanier\server && node index.js"
timeout /t 4 /nobreak > nul
echo  Backend OK

echo.
echo [3/3] Demarrage du frontend (port 3000)...
start "AlloPanier - Frontend" cmd /k "cd /d c:\Users\DJAGOZ\Desktop\alopanier\client && npm run dev"
timeout /t 6 /nobreak > nul
echo  Frontend OK

echo.
echo  ===================================================
echo    ALLOPANIER EST PRET !
echo.
echo    Site client  : http://localhost:3000
echo    Admin        : http://localhost:3000/admin
echo.
echo    Admin        : 0000000000 / Admin@2024
echo  ===================================================
echo.

start "" "http://localhost:3000"

echo  Cette fenetre peut etre fermee.
echo  Appuyez sur une touche...
pause > nul
