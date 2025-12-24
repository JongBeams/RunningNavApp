@echo off
REM =====================================
REM RunRun Backend Build Script
REM =====================================

echo [1/2] Building Spring Boot backend...
cd backend
call mvnw.cmd clean package -DskipTests
if %errorlevel% neq 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Creating deployment archive...
cd ..
tar -czf runrun-deploy.tar.gz backend\target\backend-0.0.1-SNAPSHOT.jar docker-compose.yml

echo.
echo ========================================
echo Build completed!
echo ========================================
echo.
echo File: runrun-deploy.tar.gz
echo.
echo Next step:
echo scp -i runningappkey.pem runrun-deploy.tar.gz ec2-user@3.34.96.22:~/
echo ========================================

pause
