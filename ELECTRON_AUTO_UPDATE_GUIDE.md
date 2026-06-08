# PDI Backoffice Electron 자동 업데이트 가이드

GitHub 저장소:

https://github.com/ttjssd/pdi_dante

현재 Electron 자동 업데이트 설정:

```json
{
  "provider": "github",
  "owner": "ttjssd",
  "repo": "pdi_dante"
}
```

`GH_TOKEN` 같은 토큰 값은 코드에 저장하지 않고 환경변수로만 사용합니다.

## 1. 최초 설치파일 빌드

```bash
npm run build:electron
```

성공하면 `outputs/electron` 폴더에 아래 파일이 생성됩니다.

- `PDI-Backoffice-Setup-1.8.1.exe`
- `latest.yml`
- `PDI-Backoffice-Setup-1.8.1.exe.blockmap`

이 3개 파일은 GitHub Releases에 업로드되어야 자동 업데이트가 정상 동작합니다.

## 2. win-unpacked 빌드

개발 중 빠르게 EXE 동작을 확인할 때 사용합니다.

```bash
npm run pack:electron
```

실행 파일:

```text
outputs/electron/win-unpacked/PDI Backoffice.exe
```

## 3. 업무용 노트북 최초 설치

1. `outputs/electron/PDI-Backoffice-Setup-1.8.1.exe`를 업무용 노트북으로 옮깁니다.
2. 설치파일을 실행합니다.
3. 설치 과정에서 시작 메뉴/바탕화면 바로가기를 생성합니다.
4. `PDI Backoffice`를 실행하면 `/` 런처 화면이 먼저 열립니다.
5. `START CONSOLE` 클릭 후 로딩 화면을 거쳐 `/console` 업무 대시보드로 진입합니다.

## 4. 최초 GitHub Release 생성

1. GitHub 저장소로 이동합니다.
   - https://github.com/ttjssd/pdi_dante
2. 오른쪽 `Releases` 또는 `Create a new release`로 이동합니다.
3. 릴리즈 정보를 입력합니다.
   - tag: `v1.8.1`
   - title: `PDI Backoffice 1.8.1`
4. 아래 파일 3개를 업로드합니다.
   - `outputs/electron/PDI-Backoffice-Setup-1.8.1.exe`
   - `outputs/electron/latest.yml`
   - `outputs/electron/PDI-Backoffice-Setup-1.8.1.exe.blockmap`
5. `Publish release`를 클릭합니다.

## 5. 다음 버전 배포 방법

예: `1.8.1`에서 `1.8.2`로 배포하는 경우

1. `package.json`의 `version`을 `1.8.2`로 변경
2. `package-lock.json`의 root version도 `1.8.2`로 변경
3. `app/config.ts`의 `APP_VERSION`을 `1.8.2`로 변경
4. `app/platformData.ts` 업데이트 내역에 `1.8.2` 항목 추가
5. 빌드 실행

```bash
npm run build
npm run build:electron
```

6. GitHub Releases에 새 릴리즈 생성
   - tag: `v1.8.2`
   - title: `PDI Backoffice 1.8.2`
7. 새 버전 산출물 3개 업로드
   - `PDI-Backoffice-Setup-1.8.2.exe`
   - `latest.yml`
   - `PDI-Backoffice-Setup-1.8.2.exe.blockmap`
8. 업무용 노트북에서 PDI Backoffice 실행
9. 런처에서 업데이트 감지
10. 다운로드 완료 후 `RESTART TO UPDATE` 클릭

## 5-1. 한 명령 릴리즈

소스 커밋과 push가 완료된 깨끗한 작업 폴더에서 아래 명령을 실행합니다.

```bash
npm run release:electron
```

자동 처리 항목:

1. `package.json`, `package-lock.json`, `app/config.ts` 버전 일치 검사
2. Git 작업 폴더가 깨끗한지 검사
3. 기존 로컬 Setup EXE, blockmap, `latest.yml` 정리
4. Electron 설치파일 빌드
5. 필수 파일 3개 생성 확인
6. `ttjssd/pdi_dante` GitHub Release 생성 또는 기존 태그 파일 교체

사전 준비:

```bash
gh auth login
```

`gh` 명령이 없다면 GitHub CLI를 먼저 설치해야 합니다.
소스 커밋과 push는 자동으로 수행하지 않습니다.

## 6. GH_TOKEN 자동 publish

GitHub Releases에 자동 업로드하려면 `GH_TOKEN` 환경변수가 필요합니다.

PowerShell 예시:

```powershell
$env:GH_TOKEN="github_token_value"
npm run build:electron -- --publish always
```

토큰은 GitHub Release 생성 권한이 있어야 합니다.
토큰은 코드, README, 커밋에 저장하지 않습니다.

## 7. Git 연결 준비

프로젝트가 아직 git 저장소가 아니라면 아래 흐름으로 연결합니다.

```bash
git init
git add .
git commit -m "Initial PDI Backoffice release"
git branch -M main
git remote add origin https://github.com/ttjssd/pdi_dante.git
git push -u origin main
```

주의:

- `node_modules`, `.next`, `outputs/electron` 같은 빌드 산출물은 git에 올리지 않습니다.
- 설치파일, `latest.yml`, `blockmap`은 git이 아니라 GitHub Releases에 업로드합니다.

## 8. 문제 해결

### 업데이트 확인 실패

- GitHub Release가 draft 상태인지 확인합니다.
- `latest.yml`이 Release asset에 업로드되어 있는지 확인합니다.
- `latest.yml` 안의 파일명이 실제 Setup exe 이름과 일치하는지 확인합니다.
- 회사 네트워크에서 GitHub 접근이 차단되었을 수 있습니다.
- 실패해도 앱 실행과 `START CONSOLE`은 계속 가능합니다.

### Windows 보안 경고

- 코드서명 인증서가 없으면 SmartScreen 경고가 표시될 수 있습니다.
- 개인용 배포 단계에서는 정상적인 현상입니다.
- 조직 배포가 필요해지면 코드서명 인증서를 검토합니다.

### 회사 노트북 방화벽/보안 정책

- GitHub Releases 접근이 차단되면 자동 업데이트가 실패할 수 있습니다.
- 이 경우 설치파일을 수동으로 전달해 재설치하는 백업 플로우가 필요합니다.

### 설치 권한 문제

- 현재 NSIS 설정은 사용자 단위 설치입니다.
- 관리자 권한이 없어도 설치 가능하도록 `perMachine: false`로 설정되어 있습니다.

### GitHub token 문제

- `GH_TOKEN`은 GitHub Release 생성 권한이 있는 토큰이어야 합니다.
- 토큰은 코드에 저장하지 말고 환경변수로만 사용합니다.
