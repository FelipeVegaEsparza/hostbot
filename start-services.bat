@echo off
echo ========================================
echo   Iniciando Sistema de Chatbot SaaS
echo ========================================
echo.

REM Verificar que MySQL y Redis esten corriendo
echo Verificando Docker...
docker ps | findstr chatbot-mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] MySQL no esta corriendo en Docker
    echo Ejecuta: docker-compose up -d mysql redis
    pause
    exit /b 1
)

docker ps | findstr chatbot-redis >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Redis no esta corriendo en Docker
    echo Ejecuta: docker-compose up -d mysql redis
    pause
    exit /b 1
)

echo [OK] MySQL y Redis estan corriendo
echo.

REM Verificar que los puertos esten disponibles
echo Verificando puertos...

netstat -ano | findstr :3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [ADVERTENCIA] Puerto 3000 ya esta en uso
)

netstat -ano | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo [ADVERTENCIA] Puerto 3001 ya esta en uso
)

netstat -ano | findstr :3002 >nul 2>&1
if %errorlevel% equ 0 (
    echo [ADVERTENCIA] Puerto 3002 ya esta en uso
)

echo.
echo ========================================
echo   Abriendo terminales para cada servicio
echo ========================================
echo.
echo Se abriran 4 ventanas de terminal:
echo   1. Backend API (puerto 3000)
echo   2. WhatsApp QR Service (puerto 3001)
echo   3. Dashboard (puerto 3002)
echo   4. Widget (puerto 4321)
echo.
echo Presiona cualquier tecla para continuar...
pause >nul

REM Iniciar Backend API
start "Backend API" cmd /k "cd backend && npm run start:dev"
timeout /t 2 >nul

REM Iniciar WhatsApp QR Service
start "WhatsApp QR Service" cmd /k "cd whatsapp-qr-service && npm run dev"
timeout /t 2 >nul

REM Iniciar Dashboard
start "Dashboard" cmd /k "cd dashboard && npm run dev"
timeout /t 2 >nul

REM Iniciar Widget (opcional)
echo.
echo ¿Deseas iniciar el Widget? (S/N)
set /p start_widget=
if /i "%start_widget%"=="S" (
    start "Widget" cmd /k "cd widget && npm run dev"
)

echo.
echo ========================================
echo   Servicios iniciados
echo ========================================
echo.
echo URLs:
echo   - Dashboard: http://localhost:3002
echo   - API: http://localhost:3000
echo   - API Docs: http://localhost:3000/api/docs
echo   - Widget: http://localhost:4321
echo.
echo Presiona cualquier tecla para salir...
pause >nul
