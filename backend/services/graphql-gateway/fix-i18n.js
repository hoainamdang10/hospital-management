const fs = require('fs');
const path = require('path');

// Files to fix
const files = [
  'src/resolvers/appointment.resolvers.ts',
  'src/resolvers/medical-records.resolvers.ts',
  'src/resolvers/patient.resolvers.ts'
];

// Import to add
const importToAdd = `import { contextUtils } from '../context';`;

// Function to fix i18n calls
function fixI18nCalls(content) {
  // Replace context.i18n.translate with contextUtils.translate
  return content.replace(/context\.i18n\.translate\(/g, 'contextUtils.translate(context, ');
}

// Function to fix totalCount issues
function fixTotalCount(content) {
  // Replace response.totalCount with (response as any).totalCount
  return content.replace(/response\.totalCount/g, '(response as any).totalCount');
}

// Function to add import if not exists
function addImportIfNeeded(content) {
  if (!content.includes('contextUtils')) {
    // Find the last import line
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importToAdd);
      return lines.join('\n');
    }
  }
  
  return content;
}

// Process each file
files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    console.log(`Processing ${filePath}...`);
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add import
    content = addImportIfNeeded(content);
    
    // Fix i18n calls
    content = fixI18nCalls(content);
    
    // Fix totalCount issues
    content = fixTotalCount(content);
    
    // Write back
    fs.writeFileSync(fullPath, content, 'utf8');
    
    console.log(`Fixed ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('All files processed!');
