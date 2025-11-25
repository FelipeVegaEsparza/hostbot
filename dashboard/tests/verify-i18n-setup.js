/**
 * Quick verification script for i18n setup
 * This script checks that all necessary files and configurations are in place
 * Run with: node tests/verify-i18n-setup.js
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, errorMsg) {
  if (condition) {
    checks.push({ name, status: '✅ PASS', message: '' });
    passed++;
  } else {
    checks.push({ name, status: '❌ FAIL', message: errorMsg });
    failed++;
  }
}

console.log('🔍 Verifying i18n Setup...\n');

// Check 1: i18n configuration file exists
const i18nPath = path.join(__dirname, '..', 'i18n.ts');
check(
  'i18n configuration file exists',
  fs.existsSync(i18nPath),
  'i18n.ts not found'
);

// Check 2: Middleware exists
const middlewarePath = path.join(__dirname, '..', 'middleware.ts');
check(
  'Middleware file exists',
  fs.existsSync(middlewarePath),
  'middleware.ts not found'
);

// Check 3: Spanish translation file exists
const esPath = path.join(__dirname, '..', 'messages', 'es.json');
check(
  'Spanish translation file exists',
  fs.existsSync(esPath),
  'messages/es.json not found'
);

// Check 4: English translation file exists
const enPath = path.join(__dirname, '..', 'messages', 'en.json');
check(
  'English translation file exists',
  fs.existsSync(enPath),
  'messages/en.json not found'
);

// Check 5: Language selector component exists
const selectorPath = path.join(__dirname, '..', 'components', 'language-selector.tsx');
check(
  'Language selector component exists',
  fs.existsSync(selectorPath),
  'components/language-selector.tsx not found'
);

// Check 6: Locale layout exists
const layoutPath = path.join(__dirname, '..', 'app', '[locale]', 'layout.tsx');
check(
  'Locale layout exists',
  fs.existsSync(layoutPath),
  'app/[locale]/layout.tsx not found'
);

// Check 7: next-intl is installed
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  check(
    'next-intl is installed',
    packageJson.dependencies && packageJson.dependencies['next-intl'],
    'next-intl not found in dependencies'
  );
} else {
  check('package.json exists', false, 'package.json not found');
}

// Check 8: Translation files have content
if (fs.existsSync(esPath)) {
  try {
    const esContent = JSON.parse(fs.readFileSync(esPath, 'utf8'));
    check(
      'Spanish translations have content',
      Object.keys(esContent).length > 0,
      'es.json is empty'
    );
  } catch (e) {
    check('Spanish translations are valid JSON', false, 'es.json is not valid JSON');
  }
}

if (fs.existsSync(enPath)) {
  try {
    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    check(
      'English translations have content',
      Object.keys(enContent).length > 0,
      'en.json is empty'
    );
  } catch (e) {
    check('English translations are valid JSON', false, 'en.json is not valid JSON');
  }
}

// Check 9: Translation keys match between languages
if (fs.existsSync(esPath) && fs.existsSync(enPath)) {
  try {
    const esContent = JSON.parse(fs.readFileSync(esPath, 'utf8'));
    const enContent = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    
    const esKeys = Object.keys(esContent).sort();
    const enKeys = Object.keys(enContent).sort();
    
    const keysMatch = JSON.stringify(esKeys) === JSON.stringify(enKeys);
    check(
      'Translation keys match between languages',
      keysMatch,
      'Translation keys differ between es.json and en.json'
    );
  } catch (e) {
    // Already checked JSON validity above
  }
}

// Check 10: i18n configuration has correct locales
if (fs.existsSync(i18nPath)) {
  const i18nContent = fs.readFileSync(i18nPath, 'utf8');
  check(
    'i18n config includes Spanish locale',
    i18nContent.includes("'es'"),
    'Spanish locale not found in i18n.ts'
  );
  check(
    'i18n config includes English locale',
    i18nContent.includes("'en'"),
    'English locale not found in i18n.ts'
  );
  check(
    'i18n config sets Spanish as default',
    i18nContent.includes("defaultLocale: Locale = 'es'") || 
    i18nContent.includes('defaultLocale: Locale = "es"'),
    'Spanish not set as default locale'
  );
}

// Check 11: Middleware uses correct configuration
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  check(
    'Middleware imports from i18n config',
    middlewareContent.includes("from './i18n'"),
    'Middleware does not import from i18n config'
  );
  check(
    'Middleware uses as-needed locale prefix',
    middlewareContent.includes("'as-needed'"),
    'Middleware does not use as-needed locale prefix'
  );
}

// Print results
console.log('Results:\n');
checks.forEach(({ name, status, message }) => {
  console.log(`${status} ${name}`);
  if (message) {
    console.log(`   ${message}`);
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log(`Total: ${checks.length} checks`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`${'='.repeat(60)}\n`);

if (failed === 0) {
  console.log('🎉 All checks passed! i18n setup is complete.\n');
  console.log('Next steps:');
  console.log('1. Install Playwright: npx playwright install');
  console.log('2. Run automated tests: npm test');
  console.log('3. Follow manual testing guide: tests/MANUAL_TESTING_GUIDE.md\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above.\n');
  process.exit(1);
}
