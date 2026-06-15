# PDI Custom Launcher

기존 `electron-updater + NSIS` 경로를 유지하면서 별도 Launcher를 병행 개발한다.

## 런타임 구조

```text
PDI Launcher/
├─ PDI Launcher.exe
├─ app/
│  ├─ current/
│  ├─ downloads/
│  └─ temp/
├─ backups/
├─ launcher-data/
│  ├─ local-version.json
│  ├─ settings.json
│  └─ update-state.json
└─ logs/
```

## 안전 정책

- 다운로드 및 SHA-256 검증이 끝나기 전 기존 앱을 변경하지 않는다.
- 기존 `app/current`는 버전별 backup으로 이동한 뒤 새 앱을 배치한다.
- 교체 실패 또는 강제 종료 시 다음 Launcher 실행에서 backup을 복구한다.
- `local-version.json`은 새 앱 배치 성공 후에만 변경한다.
- 기존 NSIS 업데이트는 마이그레이션 릴리즈 전까지 제거하지 않는다.

## 개발 빌드

```powershell
npm.cmd run build:launcher-runtime
npm.cmd run package:launcher-release
```

`package:launcher-release`는 GitHub Release의
`v{version}/pdi-backoffice-{version}.zip` 주소를 manifest에 기록한다.
로컬 파일로 업데이트 엔진을 시험할 때만 아래 명령을 사용한다.

```powershell
npm.cmd run package:launcher-release:local
```

결과:

- `outputs/launcher-runtime/PDI Launcher.exe`
- `outputs/launcher-runtime/app/current/PDI Backoffice.exe`
- `outputs/launcher-releases/pdi-backoffice-{version}.zip`
- `outputs/launcher-releases/version.json`

로컬 manifest를 테스트하려면 `outputs/launcher-runtime/launcher-data/settings.json`에 아래처럼 기록한다.

```json
{
  "manifestUrl": "E:\\path\\to\\outputs\\launcher-releases\\version.json"
}
```

## 현재 개발 단계

- 완료: Launcher와 업무 앱 분리 빌드
- 완료: ZIP 다운로드, SHA-256 검증, 압축 해제
- 완료: 기존 앱 backup 후 교체
- 완료: 중단된 업데이트의 다음 실행 자동 복구
- 완료: START 버튼으로 `app/current/PDI Backoffice.exe` 실행
- 보류: 공개 릴리즈 전환 및 기존 NSIS updater 제거
- 보류: Launcher 자체 업데이트
