@echo off
setlocal enabledelayedexpansion

echo JIRA Plugin 설정 도우미
echo --------------------------
echo.
echo JIRA API 토큰(PAT)을 발급받지 않았다면 다음 절차를 따르세요:
echo 1. https://id.atlassian.com/manage-profile/security/api-tokens 에 접속
echo 2. "새 토큰 생성" 버튼 클릭
echo 3. 토큰 이름 입력 후 "토큰 생성" 클릭
echo 4. 생성된 토큰 값을 안전한 곳에 복사하여 보관
echo.

:: 관리자가 배포 전 여기서 JIRA URL과 프로젝트 코드 설정하기
set "JIRA_URL=https://your-company.atlassian.net"
set "JIRA_PROJECT=PROJ"

:: 사용자에게 ID와 PAT 입력 받기
set /p JIRA_USER=JIRA 사용자 ID를 입력하세요 (예: your.name@company.com): 
set /p JIRA_TOKEN=JIRA API 토큰을 입력하세요 (해당 토큰을 안전한 곳에서 복사하여 붙여넣기): 

:: VS Code 설정 파일 위치
set "VSCODE_SETTINGS=%APPDATA%\Code\User\settings.json"
set "VSCODE_SETTINGS_INSIDERS=%APPDATA%\Code - Insiders\User\settings.json"

:: 설정 저장소 위치
set "TOKEN_SAVE_PATH=%APPDATA%\Code\User\globalStorage\gioboa.jira-plugin"
set "TOKEN_SAVE_PATH_INSIDERS=%APPDATA%\Code - Insiders\User\globalStorage\gioboa.jira-plugin"

:: VS Code Insiders 확인
if not exist "%VSCODE_SETTINGS%" (
    if exist "%VSCODE_SETTINGS_INSIDERS%" (
        set "VSCODE_SETTINGS=%VSCODE_SETTINGS_INSIDERS%"
        set "TOKEN_SAVE_PATH=%TOKEN_SAVE_PATH_INSIDERS%"
    )
)

:: 설정 파일이 없으면 새로 생성
if not exist "%VSCODE_SETTINGS%" (
    echo {} > "%VSCODE_SETTINGS%"
)

:: 토큰 저장 경로 생성
if not exist "%TOKEN_SAVE_PATH%" mkdir "%TOKEN_SAVE_PATH%"

echo.
echo 다음 설정을 적용합니다:
echo - JIRA URL: %JIRA_URL%
echo - 사용자 ID: %JIRA_USER%
echo - 프로젝트 코드: %JIRA_PROJECT%
echo.

:: PowerShell로 settings.json 파일 업데이트
echo VS Code 설정 구성 중...
powershell -Command "$settings = Get-Content -Raw -Path '%VSCODE_SETTINGS%' | ConvertFrom-Json; if($null -eq $settings) { $settings = [PSCustomObject]@{} }; $settings.'jira-plugin.baseUrl' = '%JIRA_URL%'; $settings.'jira-plugin.username' = '%JIRA_USER%'; $settings.'jira-plugin.workingProject' = '%JIRA_PROJECT%'; $settings.'jira-plugin.strictSSL' = 'false'; $settings | ConvertTo-Json -Depth 100 | Set-Content -Path '%VSCODE_SETTINGS%'"

:: JIRA 인증 정보 직접 저장
echo JIRA 인증 정보 저장 중...
set "CLEAN_URL=%JIRA_URL%"
set "CLEAN_URL=%CLEAN_URL:https://=%"
set "CLEAN_URL=%CLEAN_URL:http://=%"
set "CLEAN_URL=%CLEAN_URL:/=_%"
set "CLEAN_URL=%CLEAN_URL::=_%"

powershell -Command "Set-Content -Path '%TOKEN_SAVE_PATH%\%CLEAN_URL%.json' -Value '{\"username\":\"%JIRA_USER%\",\"password\":\"%JIRA_TOKEN%\"}'"

echo.
echo 설정이 완료되었습니다!
echo VS Code를 실행하여 바로 JIRA Plugin을 사용하세요.
echo.
echo 설정을 변경하고 싶으시면 언제든지 이 배치 파일을 다시 실행하세요.
echo.

endlocal