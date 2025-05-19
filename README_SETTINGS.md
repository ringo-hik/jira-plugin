# JIRA Plugin 간편 설정 도우미 (Windows 환경용)

이 배치 파일은 VS Code에서 JIRA Plugin을 사용하기 위한 기본 설정을 자동으로 구성해주는 도구입니다.

## 배포 전 관리자 준비

1. `jira-settings.bat` 파일을 텍스트 편집기로 열어 상단의 JIRA URL과 프로젝트 코드를 회사 환경에 맞게 수정하세요:

   ```batch
   :: 관리자가 배포 전 여기서 JIRA URL과 프로젝트 코드 설정하기
   set "JIRA_URL=https://your-company.atlassian.net"
   set "JIRA_PROJECT=PROJ"
   ```

2. 수정 후 전체 사용자에게 배포하세요.

## 사용자 실행 방법

1. `jira-settings.bat` 파일을 더블클릭하여 실행합니다.
2. 프롬프트에 따라 다음 정보를 입력합니다:
   - JIRA 사용자 ID (보통 이메일 주소 형식)
   - JIRA API 토큰 (PAT)

3. 설정이 자동으로 완료되면 VS Code를 열고 바로 JIRA 플러그인을 사용할 수 있습니다.
4. 설정을 변경하거나 토큰이 만료된 경우 언제든지 배치 파일을 다시 실행하여 재설정할 수 있습니다.

## JIRA API 토큰(PAT) 발급 방법 (상세)

JIRA API 토큰(PAT)은 비밀번호 대신 사용하는 보안 인증 방식입니다. 다음과 같이 발급받으세요:

1. [Atlassian 계정 관리](https://id.atlassian.com/manage-profile/security/api-tokens) 페이지에 로그인합니다.
   - 웹 브라우저에서 다음 주소에 접속: https://id.atlassian.com/manage-profile/security/api-tokens

2. "API 토큰 만들기" 또는 "Create API token" 버튼을 클릭합니다.
   ![API 토큰 생성 버튼](https://confluence.atlassian.com/kb/files/2081562178/2093105492/1/1643042150084/image-20220124-082544.png)

3. 토큰 이름(용도)을 입력하고 "생성" 버튼을 클릭합니다.
   - 토큰 이름 예시: "VS Code JIRA Plugin" 또는 "내부망 개발용"
   ![토큰 이름 입력](https://confluence.atlassian.com/kb/files/2081562178/2093105497/1/1643042150090/image-20220124-082610.png)

4. 생성된 토큰이 화면에 표시됩니다. 이 토큰을 복사하여 안전한 곳에 보관하세요.
   - **중요**: 토큰은 생성 시 1번만 표시됩니다. 잊어버리면 재발급받아야 합니다.
   ![생성된 토큰](https://confluence.atlassian.com/kb/files/2081562178/2093105506/1/1643042150096/image-20220124-082646.png)

5. 복사한 토큰을 설정 도우미 실행 시 "JIRA API 토큰" 입력란에 붙여넣기 하세요.

## 설정되는 항목

배치 파일은 다음 작업을 수행합니다:

1. VS Code의 `settings.json`에 다음 항목을 설정:
   - `jira-plugin.baseUrl`: 사전 설정된 JIRA 서버 URL
   - `jira-plugin.username`: 사용자가 입력한 JIRA 사용자 ID
   - `jira-plugin.workingProject`: 사전 설정된 JIRA 프로젝트 코드
   - `jira-plugin.strictSSL`: SSL 검증 설정 (false로 설정)

2. JIRA 인증 정보(사용자 ID와 API 토큰)를 VS Code의 저장소에 직접 저장하여 재인증 없이 바로 사용할 수 있게 합니다.

## 문제 해결

- **설정 오류 발생 시**: 배치 파일을 다시 실행하여 올바른 정보를 입력하세요.
- **인증 오류 발생 시**: API 토큰이 만료되었거나 잘못되었을 수 있습니다. 새 토큰을 발급받고 배치 파일을 다시 실행하세요.
- **VS Code에서 연결 안 됨**: VS Code를 완전히 종료한 후 다시 실행해보세요.