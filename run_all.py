"""
RunRun 프로젝트 통합 실행 스크립트
- React Native Metro Bundler
- Android 에뮬레이터
- Spring Boot Backend 서버
"""

import subprocess
import sys
import os
import time
from pathlib import Path

# ANSI 색상 코드
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_colored(message, color):
    """색상이 적용된 메시지 출력"""
    print(f"{color}{message}{Colors.ENDC}")

def print_header(message):
    """헤더 출력"""
    print_colored(f"\n{'='*60}", Colors.HEADER)
    print_colored(f"  {message}", Colors.HEADER + Colors.BOLD)
    print_colored(f"{'='*60}\n", Colors.HEADER)

def check_directory():
    """현재 디렉토리 확인"""
    current_dir = Path.cwd()
    if current_dir.name != "rnapp":
        print_colored(f"⚠️  경고: 현재 디렉토리가 'rnapp'이 아닙니다: {current_dir}", Colors.WARNING)
        print_colored(f"   D:\\rnapp 디렉토리에서 실행해주세요.", Colors.WARNING)
        response = input("계속 진행하시겠습니까? (y/n): ")
        if response.lower() != 'y':
            sys.exit(1)

def run_command_in_new_window(command, title, cwd=None):
    """새 cmd 창에서 명령어 실행"""
    if cwd is None:
        cwd = os.getcwd()

    # Windows cmd에서 새 창으로 실행
    full_command = f'start "{title}" cmd /k "cd /d {cwd} && {command}"'

    print_colored(f"▶️  {title} 실행 중...", Colors.OKBLUE)
    print_colored(f"   경로: {cwd}", Colors.OKCYAN)
    print_colored(f"   명령: {command}", Colors.OKCYAN)

    try:
        subprocess.Popen(full_command, shell=True)
        return True
    except Exception as e:
        print_colored(f"❌ {title} 실행 실패: {e}", Colors.FAIL)
        return False

def main():
    """메인 실행 함수"""
    print_header("🚀 RunRun 프로젝트 통합 실행 스크립트")

    # 디렉토리 확인
    check_directory()

    # 프로젝트 루트 디렉토리
    root_dir = Path.cwd()
    frontend_dir = root_dir / "frontend"
    backend_dir = root_dir / "backend"

    # 디렉토리 존재 확인
    if not frontend_dir.exists():
        print_colored(f"❌ frontend 디렉토리를 찾을 수 없습니다: {frontend_dir}", Colors.FAIL)
        sys.exit(1)

    if not backend_dir.exists():
        print_colored(f"❌ backend 디렉토리를 찾을 수 없습니다: {backend_dir}", Colors.FAIL)
        sys.exit(1)

    print_colored("\n📋 실행할 서비스:", Colors.OKGREEN)
    print_colored("   1. React Native Metro Bundler (포트: 8081)", Colors.OKGREEN)
    print_colored("   2. Android 에뮬레이터", Colors.OKGREEN)
    print_colored("   3. Spring Boot Backend (포트: 8080)", Colors.OKGREEN)
    print_colored("   4. Spring Boot Auto Compile (DevTools 자동 재시작용)", Colors.OKGREEN)

    response = input("\n계속 진행하시겠습니까? (y/n): ")
    if response.lower() != 'y':
        print_colored("실행이 취소되었습니다.", Colors.WARNING)
        sys.exit(0)

    success_count = 0
    total_services = 4

    # 1. React Native Metro Bundler 실행
    print_header("1️⃣  React Native Metro Bundler 시작")
    if run_command_in_new_window(
        "npx react-native start",
        "Metro Bundler",
        str(frontend_dir)
    ):
        success_count += 1
        time.sleep(2)  # Metro 서버 시작 대기

    # 2. Android 에뮬레이터 실행
    print_header("2️⃣  Android 에뮬레이터 시작")
    if run_command_in_new_window(
        "npm run android",
        "Android Emulator",
        str(frontend_dir)
    ):
        success_count += 1
        time.sleep(2)

    # 3. Spring Boot Backend 실행
    print_header("3️⃣  Spring Boot Backend 서버 시작")
    if run_command_in_new_window(
        "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=local",
        "Spring Boot Backend",
        str(backend_dir)
    ):
        success_count += 1
        time.sleep(2)

    # 4. Spring Boot Auto Compile 실행 (DevTools 자동 재시작용)
    print_header("4️⃣  Spring Boot Auto Compile 시작")
    print_colored("⚠️  참고: 코드 수정 후 이 창에서 'mvnw.cmd compile'을 실행하면 DevTools가 자동 재시작합니다.", Colors.WARNING)
    if run_command_in_new_window(
        "echo Spring Boot Auto Compile Window && echo. && echo 코드 수정 후 아래 명령어를 실행하세요: && echo mvnw.cmd compile && echo. && cmd /k",
        "Spring Boot Auto Compile",
        str(backend_dir)
    ):
        success_count += 1

    # 결과 출력
    print_header("✅ 실행 완료")
    print_colored(f"총 {success_count}/{total_services} 개의 서비스가 실행되었습니다.", Colors.OKGREEN)

    if success_count == 4:
        print_colored("\n🎉 모든 서비스가 성공적으로 실행되었습니다!", Colors.OKGREEN)
        print_colored("\n📌 접속 정보:", Colors.OKCYAN)
        print_colored("   - Metro Bundler: http://localhost:8081", Colors.OKCYAN)
        print_colored("   - Backend API: http://localhost:8080", Colors.OKCYAN)
        print_colored("\n💡 각 서비스는 별도의 CMD 창에서 실행됩니다.", Colors.WARNING)
        print_colored("   종료하려면 각 창을 닫거나 Ctrl+C를 누르세요.", Colors.WARNING)
        print_colored("\n🔄 백엔드 코드 수정 시:", Colors.OKCYAN)
        print_colored("   1. 코드 수정 및 저장", Colors.OKCYAN)
        print_colored("   2. 'Spring Boot Auto Compile' 창에서 'mvnw.cmd compile' 실행", Colors.OKCYAN)
        print_colored("   3. DevTools가 자동으로 서버 재시작", Colors.OKCYAN)
    else:
        print_colored(f"\n⚠️  일부 서비스 실행에 실패했습니다. ({4-success_count}개 실패)", Colors.WARNING)

    print_colored("\n" + "="*60 + "\n", Colors.HEADER)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_colored("\n\n⚠️  사용자에 의해 중단되었습니다.", Colors.WARNING)
        sys.exit(0)
    except Exception as e:
        print_colored(f"\n❌ 오류 발생: {e}", Colors.FAIL)
        sys.exit(1)
