const fs = require('fs');

// 1. Update src/data/kurmanji.ts
let kurmanji = fs.readFileSync('src/data/kurmanji.ts', 'utf-8');
const kurmanjiReplacements = {
  "icon: '🔢'": "icon: 'Binary'",
  "icon: '🎨'": "icon: 'Palette'",
  "icon: '🐈'": "icon: 'Cat'",
  "icon: '🍎'": "icon: 'Apple'",
  "icon: '👨‍👩‍👧‍👦'": "icon: 'Users'",
  "icon: '🏠'": "icon: 'Home'",
  "icon: '📅'": "icon: 'Calendar'",
};
for (const [emoji, icon] of Object.entries(kurmanjiReplacements)) {
  kurmanji = kurmanji.replace(emoji, icon);
}
fs.writeFileSync('src/data/kurmanji.ts', kurmanji);
console.log('Updated kurmanji.ts icons');

// 2. Update src/data/academic.ts
let academic = fs.readFileSync('src/data/academic.ts', 'utf-8');
const academicReplacements = {
  "icon: '🎒'": "icon: 'Backpack'",
  "icon: '🏛️'": "icon: 'Building2'",
  "icon: '🏫'": "icon: 'School'",
  "icon: '📐'": "icon: 'Ruler'",
  "icon: '💻'": "icon: 'Laptop'",
  "icon: '⚛️'": "icon: 'Atom'",
  "icon: '🧪'": "icon: 'FlaskConical'",
  "icon: '🔬'": "icon: 'Microscope'",
  "icon: '📝'": "icon: 'FileSpreadsheet'",
  "icon: '✍️'": "icon: 'PenTool'",
};
for (const [emoji, icon] of Object.entries(academicReplacements)) {
  academic = academic.replace(emoji, icon);
}
fs.writeFileSync('src/data/academic.ts', academic);
console.log('Updated academic.ts icons');

// 3. Update src/data/grammar.ts
let grammar = fs.readFileSync('src/data/grammar.ts', 'utf-8');
const grammarReplacements = {
  "icon: '👥'": "icon: 'Users'",
  "icon: '🔗'": "icon: 'Link'",
  "icon: '⏱️'": "icon: 'Clock'",
  "icon: '⚖️'": "icon: 'Scale'",
};
for (const [emoji, icon] of Object.entries(grammarReplacements)) {
  grammar = grammar.replace(emoji, icon);
}
fs.writeFileSync('src/data/grammar.ts', grammar);
console.log('Updated grammar.ts icons');

// 4. Update src/data/normalized/grammarModules.ts
let normalizedGrammar = fs.readFileSync('src/data/normalized/grammarModules.ts', 'utf-8');
const normReplacements = {
  "icon: '👥'": "icon: 'Users'",
  "icon: '🔗'": "icon: 'Link'",
};
for (const [emoji, icon] of Object.entries(normReplacements)) {
  normalizedGrammar = normalizedGrammar.replace(emoji, icon);
}
fs.writeFileSync('src/data/normalized/grammarModules.ts', normalizedGrammar);
console.log('Updated grammarModules.ts icons');
