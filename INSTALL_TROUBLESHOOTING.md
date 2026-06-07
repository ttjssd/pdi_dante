# PDI Backoffice 설치/제거 문제 해결

## 증상

Windows 앱 목록에는 `PDI Backoffice 1.7.0`이 보이지만 제거 시 아래처럼 표시될 수 있습니다.

```text
E:\pdi\PDI Backoffice\Uninstall PDI Backoffice.exe 를 찾을 수 없습니다.
```

또는 실제 설치 폴더가 비어 있는데도 재설치 시 `이미 사용자별 설치가 있습니다`라는 메시지가 나올 수 있습니다.

이 경우 이전 설치 경로가 Windows 설치 정보에 남아 있지만, 실제 제거 프로그램 파일이 삭제된 상태일 가능성이 큽니다.

## 새 설치파일 기준

현재 설치파일은 아래 기준으로 정리되어 있습니다.

- productName: `PDI Backoffice`
- executableName: `PDI Backoffice`
- 실행 파일명: `PDI Backoffice.exe`
- 설치파일명: `PDI-Backoffice-Setup-1.7.0.exe`
- uninstallDisplayName: `PDI Backoffice`
- shortcutName: `PDI Backoffice`
- appId: `com.dante.pdi-backoffice`
- NSIS guid: `9f6e4d2b-0c8a-4d9f-9c3e-2f6a7b8c1d20`
- 설치 완료 후 자동 실행: 비활성화

새 설치파일은 기존 깨진 사용자별 설치 레코드를 덜 물도록 NSIS guid를 명시합니다. 설치 완료 후에는 자동 실행하지 않고, 설치 폴더에 `PDI Backoffice.exe`와 `Uninstall PDI Backoffice.exe`가 생성되었는지 먼저 확인한 뒤 직접 실행하는 흐름을 권장합니다.

## 1. 실행 중인 프로세스 종료

PowerShell 또는 명령 프롬프트에서 실행합니다.

```cmd
taskkill /F /IM "PDI Backoffice.exe"
```

Electron 내부 서버가 남아 있으면 설치/삭제 중 파일이 잠길 수 있으므로 먼저 종료합니다.

## 2. 기존 설치 폴더 확인

아래 경로에 남은 폴더가 있는지 확인합니다.

```text
E:\pdi\PDI Backoffice
E:\pdi PDI Backoffice
%LOCALAPPDATA%\Programs\PDI Backoffice
%APPDATA%\PDI Backoffice
%LOCALAPPDATA%\pdi-backoffice
```

폴더 안에 중요한 파일이 없고 앱이 종료된 상태라면 남은 폴더를 삭제할 수 있습니다.

주의: `%APPDATA%\PDI Backoffice`에는 앱 로그나 사용자 데이터가 남을 수 있습니다. 현재 설정은 제거 시 앱 데이터를 자동 삭제하지 않도록 `deleteAppDataOnUninstall: false`로 유지합니다.

## 3. Windows 앱 목록에서 제거가 실패하는 경우

제거 프로그램 파일이 사라진 상태라면 Windows 앱 목록의 제거 버튼이 실패할 수 있습니다.

이때는 먼저 위 설치 폴더를 정리한 뒤 새 설치파일을 같은 사용자 기준으로 다시 설치합니다. 새 설치가 완료되면 정상적인 `Uninstall PDI Backoffice.exe`가 다시 생성되고, 이후 제거가 정상 동작할 가능성이 높습니다.

그래도 앱 목록의 깨진 항목이 남아 있다면 Windows의 설치 항목 정보가 꼬인 상태입니다. 이 경우 레지스트리 직접 삭제는 기본 안내하지 않습니다. 필요하면 별도로 확인 후 안전한 방식으로 진행해야 합니다.

## 4. 새 설치파일로 재설치

1. 실행 중인 `PDI Backoffice.exe`를 종료합니다.
2. 남아 있는 빈 설치 폴더를 정리합니다.
3. 새 설치파일을 실행합니다.

```text
outputs\electron\PDI-Backoffice-Setup-1.7.0.exe
```

4. 설치 경로를 선택합니다.
5. 설치 완료 후 자동 실행 체크가 보이지 않거나 꺼져 있는 상태로 마칩니다.
6. 설치 폴더에 `PDI Backoffice.exe`, `Uninstall PDI Backoffice.exe`, `resources`, `locales`가 생성되었는지 확인합니다.
7. `PDI Backoffice.exe`를 직접 실행합니다.
8. `/` 런처 화면이 열리는지 확인합니다.
9. `START CONSOLE` 클릭 후 `/console`로 진입하는지 확인합니다.

## 5. 바로가기 확인

설치 후 아래 바로가기가 생성됩니다.

- 바탕화면: `PDI Backoffice`
- 시작 메뉴: `PDI Backoffice`

바로가기가 실행되지 않으면 바로가기 대상이 실제 설치된 `PDI Backoffice.exe`를 가리키는지 확인합니다.

## 6. 제거 확인

정상 설치된 경우 설치 폴더 안에 아래 제거 파일이 생성됩니다.

```text
Uninstall PDI Backoffice.exe
```

Windows 앱 목록 또는 이 제거 파일을 통해 삭제할 수 있습니다.

## 7. 자동 업데이트 관련 주의

GitHub Releases 자동 업데이트는 아래 파일이 Release asset에 모두 업로드되어야 정상 동작합니다.

- `PDI-Backoffice-Setup-1.7.0.exe`
- `latest.yml`
- `PDI-Backoffice-Setup-1.7.0.exe.blockmap`

설치/제거 문제가 있는 상태에서는 먼저 설치 상태를 정리한 뒤 업데이트 테스트를 진행하는 편이 안전합니다.
