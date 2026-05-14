# Beauty Research Lab

แอปวิจัยตลาดความสวยความงาม — Beauty Market Research App

Single-file HTML/JS app for building beauty consumer personas, tracking market trends, and running AI-powered research (single-persona Q&A or multi-persona panel surveys) via the Claude API.

## Features

### 1. Personas Tab
- Build detailed personas with a 7-section matrix:
  - **Profile**: age, gender, location, occupation, income, education, responsibilities
  - **Psychographics & Lifestyle**: daily routine, values, personality, social media hours
  - **Beauty Behavior**: skin type, concerns, current routine, budget, brands, purchase channels
  - **Decision Drivers**: 8 sliders (price, reviews, KOL, brand, ingredients, packaging, promo, clean beauty) + trigger moments
  - **Information Sources & KOLs**: channel mix %, followed KOLs
  - **Pain Points & Aspirations**: unsolved problems, lifestyle goals, loved/hated brands
  - **Notes**: free-form
- 4 seed personas to start (Office Girl / Working Mom / Gen Z TikTok / Status Seeker)
- Import/Export JSON for sharing personas

### 2. Trends Tab
- Track current beauty market trends (dated, categorized)
- Trends are injected into every Claude prompt so personas reason against current market conditions
- 4 seed trends preloaded (TikTok dominance, ingredient shifts, skinimalism, trade-down)
- Categories: channel, product, ingredient, price, KOL, macro, culture, tech

### 3. Research Tab
Two research modes:

**Single-Persona Q&A** — Ask one persona a research question. Get:
- First-person answer in the persona's voice
- Statistical predictions (purchase probability, willingness-to-pay, channel preference)
- Key drivers + barriers
- Analytical commentary
- Actionable suggestions for the brand

**Multi-Persona Survey** — Send the same question to multiple personas. Get:
- Executive summary
- Overall distribution (% breakdown of positions)
- Aggregate statistics
- Per-persona predictions table
- Segment insights (by age, income, channel, etc.)
- Top themes + representative quotes
- Drivers / Barriers / Risks / Opportunities
- Predicted satisfaction score
- Recommendations

### Claude API Integration
- Direct browser → Anthropic API (no backend needed)
- Web Search tool (`web_search_20250305`) — pull live data into responses
- Extended Thinking — deeper analysis (optional, slower)
- 1M context + prompt caching betas supported
- Models: Opus 4.7 / Sonnet 4.6 / Haiku 4.5

### Export
- PDF via browser print (`@media print` rules optimize layout for paper)

## Usage

1. Open `index.html` in a browser (Chrome/Edge recommended for best print-to-PDF)
2. Click ⚙️ **API** in the top-right → paste your Anthropic API key
   - Get one at [console.anthropic.com](https://console.anthropic.com/)
3. Go to **Personas** tab → click "Load Seed" to get 4 example personas, or build your own
4. Go to **Trends** tab → load seed trends or add your own current market observations
5. Go to **Research** tab → pick mode → ask a question → export PDF

## Data Storage

All data lives in `localStorage` (browser-local, never sent to a server except Claude API):
- `br_personas` — persona array
- `br_trends` — trend entries
- `br_api_key` — your API key
- `br_history_single`, `br_history_survey` — last 30 saved research outputs

To reset everything: open DevTools console → `localStorage.clear()` → refresh.

## File Structure

```
beauty-research-app/
├── index.html       # Main UI with 3 tabs + API modal
├── styles.css       # Bilingual UI + print styles for PDF
├── matrix.js        # Persona matrix schema (7 sections, bilingual labels)
├── store.js         # LocalStorage wrapper
├── personas.js      # Persona CRUD + form renderer + 4 seed personas
├── trends.js        # Trend management + seed trends + prompt formatter
├── api.js           # Claude API client + system prompts + JSON parsing
├── research.js      # Single Q&A + Multi-Survey UI + result renderers
├── report.js        # PDF export via window.print()
└── app.js           # Tab switching + API modal + boot
```

## Privacy

- Your API key and all data stay in your browser (`localStorage`)
- The only outbound network call is directly to `api.anthropic.com`
- No telemetry, no third-party scripts

## Bilingual

UI is Thai + English (bilingual) — labels show both languages. Prompts to Claude are English (better instruction-following), but Claude is instructed to respond IN THAI as the persona.
