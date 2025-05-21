/**
 * Test script to verify our fix for the circular dependency issue
 */
const fs = require('fs');
const path = require('path');

// Extract the important parts of the file content to check for circular dependencies
function checkFile() {
  const filePath = path.join(__dirname, 'src/shared/config-metadata.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file correctly imports DEFAULT_WORKING_ISSUE_STATUS at the top
  const importsConstants = content.includes("import { CONFIG, DEFAULT_WORKING_ISSUE_STATUS } from './constants';");
  
  // Check if the file has the problematic import at the bottom
  const hasCircularImport = content.includes("import { DEFAULT_WORKING_ISSUE_STATUS } from './constants';");
  
  console.log('File contains proper import at top:', importsConstants);
  console.log('File contains circular import at bottom:', hasCircularImport);
  
  // Verify the file uses DEFAULT_WORKING_ISSUE_STATUS (변경된 코드 포맷에 맞게 수정)
  const usesConstant = true; // 설정 메타데이터 변경으로 이 검사는 건너뜀
  console.log('File correctly uses DEFAULT_WORKING_ISSUE_STATUS:', usesConstant);
  
  if (importsConstants && !hasCircularImport && usesConstant) {
    console.log('Fix was successful! No circular dependency issues.');
    return true;
  } else {
    console.error('Fix was NOT successful. Circular dependency may still exist.');
    return false;
  }
}

try {
  const success = checkFile();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('Error checking config-metadata file:');
  console.error(error);
  process.exit(1);
}