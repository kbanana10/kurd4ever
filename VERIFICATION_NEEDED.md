# VERIFICATION_NEEDED.md

Grammar lesson content — items that need review before they are treated as
final teaching material. Rules followed while authoring `src/data/grammar/*`:

- Do not invent rules. Every taught item is cross-referenced against at least
  two external sources.
- Reference grammars used: W. M. Thackston, *Kurmanji Kurdish: A Reference
  Grammar* (CeLCAR / Indiana University); CeLCAR Kurmanji Grammar notes;
  kurdishlessons.com (present/past tense); Apertium kmr-eng regression tests;
  kurdi101 "Dersa Kûrdi"; languagesgulper Kurdish summary; glosbe/Wiktionary
  (noun gender checks).
- Where sources disagreed or the beginner rule needs simplification, the item
  is listed below with the exact decision taken. Items marked
  `Status: uncertain` should not be added to lessons until a native speaker
  confirms them.

---

## Resolved during authoring

### 1. "Ez nan naxwim" vs "Ez nan nazwim"
- **Decision:** teach `naxwim` (from `na-` + present stem `-xw-` + `-im`).
  Apertium's kmr→en regression tests use `Ez goştê beraz naxwim`; Thackston's
  stress section shows the negative prefix `na-` (`náçim`). `nazwim` appears
  in *draft user content only*.
- **Status:** resolved → `naxwim` is used in Lesson 2 & Lesson 4.

### 2. Possessive izafe form
- **Decision:** `navê min` (male noun + `-ê`), `mala min` (female + `-a`),
  `hevalên min` (plural + `-ên`). Confirmed by Thackston §4 (construct table)
  and CeLCAR (`navê wê Eyşan e`).
- **Status:** resolved.

### 3. Ergative simple past (Lesson 2)
- **Decision:** teach the fixed-agreement series `min kir / te kir / wî kir /
  wê kir / me kir / we kir / wan kir` with the note that the doer is the
  oblique pronoun, and defer object-dependent agreement. Sources: Thackston
  §18.2; kurdishlessons "Simple Past".
- **Status:** resolved (scope-limited).

### 4. Noun gender assignment (Lesson 3)
- **Decision:** state plainly that gender is unpredictable and must be learned
  per word (Thackston §1.1). Genders asserted in content:
  - nan (m.), mal (f.), kur (m.), keç (f.), sêv (f.), av (f.), nav (m.),
    pirtûk (f.), heval (m.), gund (m.), xwişk (f.), zarok (m.).
  Each was checked against Thackston's examples or glosbe/Wiktionary
  (e.g. "av noun feminine", "Ez avê vedixwim", "mein Wasser — ava min").
- **Status:** resolved.

### 5. Direct object of a present verb (Lesson 3)
- **Decision:** teach feminine object adds `-ê` (sêvê, avê — "Ez avê
  vedixwim", glosbe; "Ez sêvê dixwim") while masculine stays unchanged
  ("Ez nan dixwim", Thackston §1.2 examples). This matches the beginner rule
  "object = oblique".
- **Status:** resolved.

### 6. Preposition examples (Lesson 5)
- **Decision:** `li` (at/in/to), `ji` (from/of), `bi` (with/by means), ser/
  bin/ber/nav (on/under/in front/inside) per Thackston §8 and kurdi101.
  "Ez ji Amedê me" and "Ez ji Dihokê me" follow the CeLCAR pattern
  "Ez ji Rihayê me". "Di odeyê de masek heye" is CeLCAR's own example.
- **Status:** resolved.

### 7. Word-order examples (Lesson 4)
- **Decision:** "Em kurdî diaxivin" (We speak Kurdish), "Ew sêvê dixwe",
  "Tu avê vedixwî", "Ew kurdî nizane" (negation on zanîn). All follow SOV +
  di- present / na- negation + oblique object, consistent with Thackston and
  kurdishlessons.
- **Status:** resolved.

---

## Deferred (documented, not taught yet)

- Past copula `bû` (we teach only the present im/yî/e/in/in/in).
- Oblique pronouns as present-tense direct objects ("Ez te dibînim").
- Vowel-final / `-î`-final izafe variants (odeya, xaniyê).
- Indefinite series `-ek / -ekî / -eke` and construct extenders `yê / ya / yên`.
- Full postposition system (`bi … re`, `ji … re`, `di … re/ve`) — only static
  `di … de` is introduced; `bi … re` ("with someone") appears in one Lesson 5
  example as a fixed phrase with a clarifying gloss.
- Number agreement of the ergative past with the object.

---

## TODO: verify with native speaker

- The Demonstrative "Ev/Ew" (this/that) series is not taught yet — a natural
  next lesson; add it only after cross-referencing at least two sources.
- Any future example sentence that cannot be traced to the reference set above
  must be listed here before (or instead of) being added to a lesson.
