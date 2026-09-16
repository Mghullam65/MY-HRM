const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../Design Copy/Document.html');
const html = fs.readFileSync(filePath, 'utf8');

const clean = str => str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const h1s = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m => clean(m[1]));
const h2s = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => clean(m[1]));
const h3s = [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map(m => clean(m[1]));
const h4s = [...html.matchAll(/<h4[^>]*>([\s\S]*?)<\/h4>/gi)].map(m => clean(m[1]));

console.log('=== H1 HEADINGS ===');
console.log(h1s);

console.log('\n=== H2 HEADINGS ===');
console.log(h2s);

console.log('\n=== H3 HEADINGS ===');
console.log(h3s);

console.log('=== H4 HEADINGS ===');
console.log(h4s);

// Extract all feature paragraphs and lists
const listItems = [...html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
  .map(m => clean(m[1]))
  .filter(t => t.length > 15 && t.length < 250 && !t.includes('Cookie') && !t.includes('http'));

console.log('\n=== KEY FEATURE BULLETS (' + listItems.length + ') ===');
console.log(listItems.slice(0, 50));

// Extract all FAQ question/answers
const faqQuestions = [...html.matchAll(/class="[^"]*faq[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/gi)]
  .map(m => clean(m[1])).filter(t => t.length > 20);

// Search for modules mentioned
const moduleMentions = ['payroll', 'attendance', 'leave', 'recruitment', 'onboarding', 'training', 'lms', 'eobi', 'tax', 'provident', 'gratuity', 'geofence', 'biometric', 'appraisal', 'performance', 'exit', 'settlement', 'overtime', 'shift', 'multi-currency', 'mobile', 'whatsapp', 'slack', 'integration', 'gl', 'accounting'];
const foundModules = {};
for (const m of moduleMentions) {
  const regex = new RegExp(`\\b${m}\\b`, 'gi');
  const count = (html.match(regex) || []).length;
  foundModules[m] = count;
}
console.log('\n=== MODULE & KEYWORD FREQUENCIES ===');
console.log(foundModules);
