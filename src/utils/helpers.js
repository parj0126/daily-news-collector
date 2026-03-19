const path = require('path');
const fs = require('fs');

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function saveReport(content, filename, outputDir) {
  ensureDir(outputDir);
  
  const filePath = path.join(outputDir, filename);
  fs.writeFileSync(filePath, content, 'utf-8');
  
  const latestPath = path.join(outputDir, 'latest.md');
  fs.writeFileSync(latestPath, content, 'utf-8');
  
  console.log(`报告已保存: ${filePath}`);
  return filePath;
}

function encodeURIFn(str) {
  return encodeURIComponent(str);
}

module.exports = {
  ensureDir,
  saveReport,
  encodeURIFn
};
