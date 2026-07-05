@echo off
title AlloPanier - Arret
color 0C

echo.
echo  Arret de AlloPanier...

taskkill /f /im node.exe > nul 2>&1
echo  Serveurs arretes.

echo.
echo  AlloPanier arrete. Appuyez sur une touche...
pause > nul
