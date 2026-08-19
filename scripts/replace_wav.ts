import fs from 'fs';
const file = 'scripts/generateAudio.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\.wav/g, '.mp3');
fs.writeFileSync(file, content);
console.log('Replaced all .wav with .mp3 in generateAudio.ts');
