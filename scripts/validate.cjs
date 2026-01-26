const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/resources.json'), 'utf8'));

console.log('Total resources:', data.length);

const cats = {};
const subs = {};
data.forEach(res => {
  cats[res.category] = (cats[res.category] || 0) + 1;
  subs[res.category + ' → ' + res.subCategory] = (subs[res.category + ' → ' + res.subCategory] || 0) + 1;
});

console.log('\nCategories:');
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log('  ' + k + ':', v));

console.log('\nSubcategories (' + Object.keys(subs).length + ' total):');
Object.entries(subs).sort((a, b) => a[0].localeCompare(b[0])).forEach(([k, v]) => console.log('  ' + k + ':', v));

const avgLen = Math.round(data.reduce((s, x) => s + (x.description?.length || 0), 0) / data.length);
console.log('\nAvg description length:', avgLen, 'chars');

const missing = data.filter(x => !x.screenshot).map(x => x.name);
console.log('Missing screenshots:', missing.length ? missing.join(', ') : 'None');
