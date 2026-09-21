const fs = require('fs');

const content = fs.readFileSync('js/performance.js', 'utf8');
const lines = content.split('\n');

const perfLines = lines.slice(0, 2088);
perfLines.push('');
perfLines.push("if (typeof window !== 'undefined') window.Performance = Performance;");
perfLines.push("if (typeof module !== 'undefined' && module.exports) module.exports = Performance;");
perfLines.push('');

const recruitLines = lines.slice(2089);
recruitLines.push('');
recruitLines.push("if (typeof window !== 'undefined') window.Recruitment = Recruitment;");
recruitLines.push("if (typeof module !== 'undefined' && module.exports) module.exports = Recruitment;");
recruitLines.push('');

fs.writeFileSync('js/performance.js', perfLines.join('\n'));
fs.writeFileSync('js/recruitment.js', recruitLines.join('\n'));

console.log('performance.js lines:', perfLines.length);
console.log('recruitment.js lines:', recruitLines.length);
