/**
 * generateAudio.ts
 * 
 * Content-hashed batch audio generator for Kurdish Quest.
 * Guarantees that re-runs only query the external TTS provider for new or modified text,
 * saving API quota and billing costs.
 * 
 * Usage:
 *   npx tsx scripts/generateAudio.ts [--dry-run] [--force] [--limit 10] [--verbose]
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { KurdishTTSProvider } from '../services/tts/providers/KurdishTTSProvider.js';
import { alphabet, vocabulary, sentences } from '../src/data/kurmanji.js';
import { academicVocabulary } from '../src/data/academic.js';

dotenv.config();

const AUDIO_ROOT = path.join(process.cwd(), 'public');
const MANIFEST_PATH = path.join(AUDIO_ROOT, 'audio', 'manifest.json');

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isForce = args.includes('--force');
const isVerbose = args.includes('--verbose');
const limitArgIdx = args.indexOf('--limit');
const limit = limitArgIdx !== -1 && args[limitArgIdx + 1] ? parseInt(args[limitArgIdx + 1], 10) : Infinity;

interface ManifestEntry {
  path: string;
  text: string;
  hash: string;
  lang: string;
  speakerId: string;
  updatedAt: string;
  sizeBytes?: number;
}

type AudioManifest = Record<string, ManifestEntry>;

function computeHash(text: string, lang: string, speakerId: string): string {
  return crypto
    .createHash('sha256')
    .update(`${text.trim()}:${lang}:${speakerId}`)
    .digest('hex');
}

function loadManifest(): AudioManifest {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      const data = fs.readFileSync(MANIFEST_PATH, 'utf-8');
      return JSON.parse(data) as AudioManifest;
    }
  } catch (err) {
    console.warn('[Manifest] Could not load existing manifest, creating new one.', err);
  }
  return {};
}

function saveManifest(manifest: AudioManifest) {
  try {
    const dir = path.dirname(MANIFEST_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`[Manifest] Successfully wrote manifest to ${MANIFEST_PATH}`);
  } catch (err) {
    console.error('[Manifest] Failed to write manifest:', err);
  }
}

async function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function run() {
  console.log('='.repeat(65));
  console.log('🎙️ Kurdish Quest Content-Hashed Audio Generator');
  console.log('='.repeat(65));
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (Simulated)' : 'LIVE'}`);
  console.log(`Force re-generation: ${isForce ? 'YES' : 'NO'}`);
  if (isFinite(limit)) console.log(`Limit: ${limit} items`);

  const speakerId = process.env.KURDISHTTS_SPEAKER_ID || 'kurmanji_236';
  const modelVersion = process.env.KURDISHTTS_MODEL_VERSION || 'v4';
  const apiKey = process.env.KURDISHTTS_API_KEY || '';

  const provider = new KurdishTTSProvider({
    apiKey,
    modelVersion,
    speakerId,
  });

  const manifest = loadManifest();

  // Gather complete target corpus
  interface AudioTask {
    text: string;
    targetPath: string;
    lang: string;
    category?: string;
  }

  const tasks: AudioTask[] = [];

  // 1. Alphabet example words & character names
  for (const item of alphabet) {
    const charLetter = item.char.split(' ')[0];
    const charSlug = charLetter
      .toLowerCase()
      .replace('ç', 'c_cedilla')
      .replace('ê', 'e_circumflex')
      .replace('î', 'i_circumflex')
      .replace('ş', 's_cedilla')
      .replace('û', 'u_circumflex');

    if (item.audio) {
      tasks.push({ text: item.exampleWord || charLetter, targetPath: item.audio, lang: 'ku', category: 'alphabet' });
    }
    tasks.push({
      text: charLetter,
      targetPath: `/audio/alphabet/char_${charSlug}.mp3`,
      lang: 'ku',
      category: 'alphabet',
    });
  }

  // 2. Core Vocabulary
  for (const item of vocabulary) {
    if (item.audio && item.ku) {
      tasks.push({ text: item.ku, targetPath: item.audio, lang: 'ku', category: item.categoryId || 'general' });
    }
  }

  // 3. Sentences
  for (const item of sentences) {
    if (item.audio && item.ku) {
      tasks.push({ text: item.ku, targetPath: item.audio, lang: 'ku', category: 'sentences' });
    }
  }

  // 4. Academic Vocabulary
  for (const item of academicVocabulary) {
    if (item.audio && item.ku) {
      tasks.push({ text: item.ku, targetPath: item.audio, lang: 'ku', category: 'academic' });
    }
  }

  // Deduplicate by targetPath
  const uniqueTasksMap = new Map<string, AudioTask>();
  for (const t of tasks) {
    if (!uniqueTasksMap.has(t.targetPath)) {
      uniqueTasksMap.set(t.targetPath, t);
    }
  }
  const uniqueTasks = Array.from(uniqueTasksMap.values()).slice(0, limit);

  console.log(`Corpus total: ${uniqueTasks.length} unique utterances to verify.`);

  let skippedCount = 0;
  let generatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < uniqueTasks.length; i++) {
    const task = uniqueTasks[i];
    const hash = computeHash(task.text, task.lang, speakerId);
    const fullDiskPath = path.join(AUDIO_ROOT, task.targetPath.startsWith('/') ? task.targetPath.slice(1) : task.targetPath);
    const existingEntry = manifest[task.targetPath];

    const fileExists = fs.existsSync(fullDiskPath);
    const isUnchanged = existingEntry && existingEntry.hash === hash && fileExists;

    if (isUnchanged && !isForce) {
      skippedCount++;
      if (isVerbose) {
        console.log(`[SKIP - UNCHANGED] (${i + 1}/${uniqueTasks.length}) ${task.targetPath} ("${task.text}")`);
      }
      continue;
    }

    if (isDryRun) {
      console.log(`[DRY-RUN WOULD GENERATE] (${i + 1}/${uniqueTasks.length}) ${task.targetPath} ("${task.text}")`);
      generatedCount++;
      manifest[task.targetPath] = {
        path: task.targetPath,
        text: task.text,
        hash,
        lang: task.lang,
        speakerId,
        updatedAt: new Date().toISOString(),
        sizeBytes: 0,
      };
      continue;
    }

    try {
      await ensureDir(fullDiskPath);
      // Small throttle to respect API rate limits
      await new Promise(r => setTimeout(r, 250));

      process.stdout.write(`[GENERATING] (${i + 1}/${uniqueTasks.length}) ${task.targetPath} ("${task.text}")... `);
      const audioBuffer = await provider.generateAudio(task.text, task.lang);
      fs.writeFileSync(fullDiskPath, audioBuffer);
      console.log(`OK (${audioBuffer.length} bytes)`);

      manifest[task.targetPath] = {
        path: task.targetPath,
        text: task.text,
        hash,
        lang: task.lang,
        speakerId,
        updatedAt: new Date().toISOString(),
        sizeBytes: audioBuffer.length,
      };
      generatedCount++;
    } catch (err: any) {
      console.log(`FAILED: ${err.message}`);
      errorCount++;
    }
  }

  // Save the manifest whenever files were generated or in dry run
  saveManifest(manifest);

  console.log('='.repeat(65));
  console.log('📊 Summary Report:');
  console.log(`   - Total Checked: ${uniqueTasks.length}`);
  console.log(`   - Skipped (Cached/Unchanged): ${skippedCount}`);
  console.log(`   - Newly Generated: ${generatedCount}`);
  console.log(`   - Failed: ${errorCount}`);
  console.log('='.repeat(65));
}

run().catch(err => {
  console.error('[FATAL] Audio generation script encountered an error:', err);
  process.exit(1);
});
