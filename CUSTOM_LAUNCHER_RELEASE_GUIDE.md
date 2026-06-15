# PDI Custom Launcher Release Guide

## 구조

커스텀 런처와 실제 업무 앱은 서로 독립적으로 배포한다.

```text
PDI Launcher/
├─ PDI Launcher.exe
├─ app/
│  ├─ current/       # 현재 실행할 PDI Backoffice 전체 파일
│  ├─ downloads/     # 내려받은 ZIP 임시 보관
│  └─ temp/          # 압축 해제 임시 경로
├─ backups/          # 업데이트 전 버전
├─ launcher-data/
│  ├─ local-version.json
│  ├─ settings.json
│  ├─ update-state.json
│  └─ private-assets/ # 사용자가 직접 선택한 로컬 배경
└─ logs/
   └─ launcher.log
```

`app/current`에는 `PDI Backoffice.exe`, `resources`, `locales`, DLL 등
Electron 업무 앱 실행에 필요한 전체 파일이 들어간다. Launcher 파일은 포함하지 않는다.

## GitHub Release 파일

애플리케이션 버전이 `1.9.7`, Launcher 버전이 `1.0.0`인 예:

- `PDI-Launcher-Setup-1.0.0.exe`
- `version.json`
- `pdi-backoffice-1.9.7.zip`
- `pdi-backoffice-1.9.7.zip.sha256`

Release tag는 업무 앱 버전에 맞춰 `v1.9.7`로 만든다. Launcher 설치 파일은
Launcher가 변경될 때만 다시 올려도 된다.

## version.json

```json
{
  "version": "1.9.7",
  "minLauncherVersion": "1.0.0",
  "releaseDate": "2026-06-10",
  "notes": ["업데이트 제목"],
  "packages": {
    "windows": {
      "url": "https://github.com/ttjssd/pdi_dante/releases/download/v1.9.7/pdi-backoffice-1.9.7.zip",
      "sha256": "ZIP_SHA256",
      "size": 123456789
    }
  }
}
```

Launcher는 항상 아래 고정 주소에서 최신 manifest를 확인한다.

```text
https://github.com/ttjssd/pdi_dante/releases/latest/download/version.json
```

## 빌드 명령

```powershell
npm.cmd run build:app-package
npm.cmd run package:app-zip
npm.cmd run build:launcher
npm.cmd run build:launcher-installer
```

전체 릴리즈 파일을 한 번에 만들 때:

```powershell
npm.cmd run release:package
```

산출물:

```text
outputs/app-package/win-unpacked/
outputs/launcher/win-unpacked/PDI Launcher.exe
outputs/launcher-installer/PDI-Launcher-Setup-1.0.0.exe
outputs/launcher-releases/version.json
outputs/launcher-releases/pdi-backoffice-{version}.zip
outputs/launcher-releases/pdi-backoffice-{version}.zip.sha256
outputs/custom-release/ # GitHub Release에 올릴 4개 파일만 모은 폴더
```

로컬 파일 URL로 업데이트를 시험할 때만 아래 명령을 사용한다.

```powershell
npm.cmd run package:app-zip:local
```

## 업무용 노트북 최초 설치

1. GitHub Release에서 `PDI-Launcher-Setup-1.0.0.exe`를 받는다.
2. Launcher를 사용자별 기본 경로에 설치한다.
3. Launcher를 실행한다.
4. `app/current`가 비어 있으면 Launcher가 최신 `version.json`을 확인한다.
5. 최신 업무 앱 ZIP을 자동 다운로드하고 SHA-256을 검증한다.
6. 설치 완료 후 START 버튼이 활성화된다.
7. START를 누르면 `/console`로 업무 앱이 열린다.
8. 업무 앱 실행이 확인되면 Launcher 창은 자동으로 숨겨진다.
9. 업무 앱을 종료하면 Launcher 창이 다시 표시된다.

## 새 업무 앱 버전 배포

1. `package.json`과 앱 버전 상수를 같은 semver로 올린다.
2. 업데이트 내역을 추가한다.
3. `npm.cmd run release:package`를 실행한다.
4. GitHub에 `v{업무 앱 버전}` Release를 생성한다.
5. `version.json`, ZIP, SHA 파일을 업로드한다.
6. Launcher를 변경했다면 Launcher Setup도 함께 올린다.

ZIP 이름과 `version.json`의 URL, GitHub tag가 정확히 일치해야 한다.
`outputs/custom-release`의 네 파일을 그대로 Release asset으로 업로드하면 된다.

## 업데이트와 복구

1. ZIP을 다운로드한다.
2. SHA-256이 일치하는지 검사한다.
3. 임시 폴더에 압축을 푼다.
4. 기존 `app/current`를 `backups`로 이동한다.
5. 새 앱을 `app/current`에 배치한다.
6. 성공한 뒤에만 `local-version.json`을 갱신한다.

교체 도중 Launcher가 종료되면 다음 실행 때 `update-state.json`을 확인해
기존 backup을 자동 복원한다. 업데이트 실패 후에도 기존 앱이 남아 있으면 START가 유지된다.

## 로컬 프라이빗 배경

- 배경은 `launcher-data/private-assets`에만 복사된다.
- Git 저장소와 업무 앱 ZIP에는 포함되지 않는다.
- 프라이빗 모드 PIN 인증 전에는 기본 배경만 표시된다.
- 원본 파일이 삭제되어도 Launcher가 복사한 파일은 유지된다.
- Launcher 내부 복사본이 없거나 손상되면 기본 배경으로 돌아간다.
- `RESET BACKGROUND`는 Launcher 내부 복사본과 배경 경로를 함께 초기화한다.

## 기존 NSIS 방식과 차이

기존 방식은 업무 앱 전체 설치 프로그램을 다시 실행하고 `electron-updater`가
NSIS 패키지를 교체한다. 커스텀 Launcher 방식은 업무 앱 ZIP만 받아
`app/current`를 교체하므로 설치 마법사를 다시 띄우지 않는다.

기존 `PDI Backoffice` NSIS와 `electron-updater` 코드는 전환 안정화가 끝날 때까지
백업 경로로 유지한다.

## Launcher 자체 업데이트

현재 Launcher 자체 업데이트는 자동화하지 않았다. Launcher 버전이 변경되면
새 `PDI-Launcher-Setup-{version}.exe`를 수동 설치하거나 교체해야 한다.

TODO:

- Launcher 전용 manifest
- Launcher 자체 다운로드 및 재실행 교체 도우미
- 이전 Launcher 버전 마이그레이션
