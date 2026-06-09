# PDI 백오피스 플랫폼

여러 개인 백오피스 업무 도구를 확장할 수 있는 Next.js 플랫폼입니다. 웹 런처와 콘솔 대시보드를 기준으로 누락(재상품화) 가이드, 상품화 키워드 추출, 탁송 보조 툴을 제공합니다.

## 주요 기능

- 다크 모드 기반 웹 런처 및 백오피스 콘솔
- 업무 카테고리 및 세부 기능 페이지
- 탁송 이슈 응답 보조 및 제주도 탁송 요청 문구 생성
- 슬랙 원문에서 멘션, 차량번호, 차량명, 문제 내용, 이동/처리 예정 문구 추출
- 문제 키워드 기반 상품화 필요 칸반 카테고리 복수 추천
- 현장 약어를 표준 부위명으로 변환
- 추천 작업 및 복붙용 키워드 생성
- 추천 카테고리, 작업, 키워드 직접 수정 및 항목 추가·삭제
- 실제 신청할 항목 선택 및 선택 결과 전체 복사
- 최근 상품화 추천 기록을 브라우저 `localStorage`에 최대 30건 저장
- 콘솔 도구 키워드 검색
- 프라이빗 런처 영상, 밝기, 순서, PIN 로컬 설정
- 저장 기록 다시 불러오기 및 삭제
- 모바일과 PC 반응형 UI
- 외부 API 없이 브라우저에서 동작

## 주요 경로

- `/`: 웹 런처
- `/console`: 플랫폼 콘솔 홈
- `/remanufacturing`: 누락(재상품화) 가이드
- `/remanufacturing/keyword-extractor`: 상품화 키워드 추출기
- `/remanufacturing/guide`: 자체 상품화 및 칸반 후속 작업 가이드
- `/transport-tools`: 탁송 보조 툴
- `/transport-tools/issue-helper`: 탁송 이슈 응답 보조
- `/transport-tools/jeju-request`: 제주도 탁송 요청 문구 생성
- `/hangdong-guide`: 항동센터 가이드
- `/settings`: 프라이빗 모드 설정

자동 분석 결과는 현장 문장 형태에 따라 달라질 수 있으므로 문구 생성 전에 추출값을 확인해 주세요.

## 실행 방법

Node.js 18.17 이상이 필요합니다.

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 배포용 빌드

```bash
npm run build
npm run start
```

## Electron 앱 밑작업

Electron 창에서 Next.js standalone 서버를 자동 실행한 뒤 `/` 런처 화면을 엽니다.

```bash
npm run electron:dev
npm run pack:electron
npm run build:electron
```

`pack:electron`은 빠르게 `outputs/electron/win-unpacked/PDI Backoffice.exe`를 만듭니다.
`build:electron`은 `outputs/electron` 폴더에 Setup EXE, blockmap, `latest.yml`을 생성합니다.

소스 커밋과 push 이후 GitHub Release까지 자동 처리하려면:

```bash
gh auth login
npm run release:electron
```

## 로컬 개인 배경

Electron EXE의 `/settings`에서 `로컬 배경 추가`를 누르면 영상과 이미지가
`%APPDATA%\PDI Backoffice\backgrounds`에 복사됩니다.
개인 배경은 프로젝트, GitHub 저장소, 설치파일과 자동 업데이트 패키지에 포함되지 않습니다.
