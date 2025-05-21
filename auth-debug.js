/**
 * Jira 인증 디버그 스크립트
 * 다양한 인증 방식을 테스트합니다.
 */
const https = require('https');
const http = require('http');

// 설정값 (테스트할 값을 여기에 입력)
const JIRA_URL = 'http://localhost:8080'; // Jira 서버 URL (이 주소를 실제 Jira 서버 주소로 변경하세요)
const USERNAME = 'your-username'; // Jira 사용자 이름
const PASSWORD = 'your-password'; // Jira 비밀번호
const PAT_TOKEN = 'your-pat-token'; // PAT 토큰

// 호스트 이름과 포트 파싱 (URL 형식 수정)
const urlParts = JIRA_URL.replace('https://', '').replace('http://', '').split(':');
const HOSTNAME = urlParts[0];
const PORT = urlParts.length > 1 ? parseInt(urlParts[1], 10) : (JIRA_URL.includes('https://') ? 443 : 80);

// SSL 검증 비활성화 (자체 서명 인증서 사용 시 필요)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

/**
 * 기본 인증 테스트 (사용자 이름/비밀번호)
 */
function testBasicAuth() {
  console.log('\n1. 기본 인증 테스트 (사용자 이름/비밀번호)...');
  
  const authString = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  
  const options = {
    hostname: HOSTNAME,
    port: PORT,
    path: '/rest/api/2/myself',
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = (JIRA_URL.includes('https://') ? https : http).request(options, (res) => {
    console.log(`상태 코드: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('응답 데이터:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('JSON 파싱 실패:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`요청 오류: ${e.message}`);
  });
  
  req.end();
}

/**
 * PAT 토큰 인증 테스트
 */
function testPatAuth() {
  console.log('\n2. PAT 토큰 인증 테스트...');
  
  const options = {
    hostname: HOSTNAME,
    port: PORT,
    path: '/rest/api/2/myself',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${PAT_TOKEN}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = (JIRA_URL.includes('https://') ? https : http).request(options, (res) => {
    console.log(`상태 코드: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('응답 데이터:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('JSON 파싱 실패:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`요청 오류: ${e.message}`);
  });
  
  req.end();
}

/**
 * 서버 정보 가져오기
 */
function getServerInfo() {
  console.log('\n3. 서버 정보 가져오기...');
  
  const options = {
    hostname: HOSTNAME,
    port: PORT,
    path: '/rest/api/2/serverInfo',
    method: 'GET'
  };
  
  const req = (JIRA_URL.includes('https://') ? https : http).request(options, (res) => {
    console.log(`상태 코드: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('응답 데이터:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('JSON 파싱 실패:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`요청 오류: ${e.message}`);
  });
  
  req.end();
}

// 모든 테스트 실행
console.log('Jira 인증 테스트 시작...');
console.log(`Jira URL: ${JIRA_URL}`);
console.log(`호스트: ${HOSTNAME}`);
console.log(`포트: ${PORT}`);
console.log(`사용자 이름: ${USERNAME}`);

// 테스트 추가 - PAT를 Basic 인증으로 시도
function testPatAsBasicAuth() {
  console.log('\n4. PAT를 Basic 인증으로 시도...');
  
  // PAT를 사용자 이름으로, 빈 비밀번호 사용
  const authString = Buffer.from(`${PAT_TOKEN}:`).toString('base64');
  
  const options = {
    hostname: HOSTNAME,
    port: PORT,
    path: '/rest/api/2/myself',
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    }
  };
  
  const req = (JIRA_URL.includes('https://') ? https : http).request(options, (res) => {
    console.log(`상태 코드: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('응답 데이터:');
      try {
        const jsonData = JSON.parse(data);
        console.log(JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log('JSON 파싱 실패:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error(`요청 오류: ${e.message}`);
  });
  
  req.end();
}

getServerInfo();
setTimeout(testBasicAuth, 1000);
setTimeout(testPatAuth, 2000);
setTimeout(testPatAsBasicAuth, 3000);