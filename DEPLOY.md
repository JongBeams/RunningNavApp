# RunRun 배포 가이드

## 백엔드 배포 (AWS Lightsail)

### 1. 로컬에서 빌드 및 압축

```powershell
# PowerShell에서 실행

# 1. 백엔드 빌드
cd D:\rnapp\backend
.\mvnw.cmd clean package -DskipTests

# 2. 압축
cd D:\rnapp
tar -czf runrun-deploy.tar.gz backend\target\backend-0.0.1-SNAPSHOT.jar docker-compose.yml

# 3. 서버로 전송
scp -i runningappkey.pem runrun-deploy.tar.gz ec2-user@3.34.96.22:~/
```

### 2. 서버에서 배포

```bash
# Lightsail SSH에서 실행

# 1. 파일 이동 및 압축 해제
cd ~/runrun
mv ~/runrun-deploy.tar.gz .
tar -xzf runrun-deploy.tar.gz

# 2. 서비스 재시작
docker-compose down
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f backend
# "Started BackendApplication" 확인 후 Ctrl+C

# 4. 상태 확인
docker-compose ps
```

---

## 프론트엔드 빌드 (Android APK)

### 프로덕션 APK 빌드

```bash
# PowerShell에서 실행

cd D:\rnapp\frontend\android
.\gradlew assembleRelease
```

**APK 위치:**
```
D:\rnapp\frontend\android\app\build\outputs\apk\release\app-release.apk
```

### APK 설치

```bash
# USB 연결 후
cd D:\rnapp\frontend
npx react-native run-android --variant=release

# 또는 APK 파일을 직접 기기로 전송하여 설치
```

---

## 서버 정보

- **서버 IP:** 3.34.96.22
- **백엔드 포트:** 8080
- **SSH 키:** runningappkey.pem
- **사용자:** ec2-user

## API URL 설정

프론트엔드는 자동으로 개발/프로덕션 환경을 구분합니다:

- **개발 모드 (에뮬레이터):** `http://10.0.2.2:8080`
- **프로덕션 모드 (실제 기기):** `http://3.34.96.22:8080`

설정 파일: `frontend/src/services/api/client.ts`

---

## 유용한 명령어

### 서버 상태 확인

```bash
# 컨테이너 상태
docker-compose ps

# 로그 보기
docker-compose logs backend
docker-compose logs postgres

# API 테스트
curl http://localhost:8080/api/auth/login
```

### 서버 관리

```bash
# 서비스 중지
docker-compose down

# 서비스 시작
docker-compose up -d

# 재시작
docker-compose restart

# 볼륨 포함 완전 삭제 (데이터베이스 초기화)
docker-compose down -v
```

---

## 문제 해결

### 빌드 실패 시

```powershell
# 캐시 정리 후 재빌드
cd D:\rnapp\backend
.\mvnw.cmd clean
.\mvnw.cmd package -DskipTests
```

### 서버 메모리 부족 시

```bash
# 사용하지 않는 Docker 이미지 정리
docker system prune -a

# 메모리 확인
free -h
docker stats
```

### APK 빌드 실패 시

```bash
cd D:\rnapp\frontend\android
.\gradlew clean
.\gradlew assembleRelease
```
