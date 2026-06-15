/**
 * Smart Search Test Runner
 * Tests 12+ diverse natural language queries against the running server.
 * Run: node scripts/test-smart-search.mjs
 * Requires: server running on localhost:5001
 */

const BASE = 'http://localhost:5001';
const DELAY_MS = 10000; // 10s between AI calls — stays within Groq TPM limits

const TESTS = [
  { label: '1. Cinema room setup',              query: 'set up a cinema room for family movie nights' },
  { label: '2. TV under 80k',                   query: 'TV setup under 80000' },
  { label: '3. Work from home desk under 50k',  query: 'I work from home and need a proper desk setup under 50000' },
  { label: '4. Gaming rig under 60k',           query: 'gaming setup under 60000' },
  { label: '5. Morning skincare routine',       query: 'morning skincare routine essentials' },
  { label: '6. Kitchen starter kit',            query: 'kitchen starter kit for a new apartment' },
  { label: '7. Gift for gadget lover 30k',      query: 'gift for my dad who loves gadgets budget 30000' },
  { label: '8. Smart home setup',               query: 'smart home setup' },
  { label: '9. Phone bundle under 80k',         query: 'complete mobile phone bundle under 80000' },
  { label: '10. Wireless audio under 5k',       query: 'wireless earbuds or headphones under 5000' },
  { label: '11. Streaming entertainment 10k',   query: 'streaming and entertainment setup under 10000' },
  { label: '12. Home office ergonomics',        query: 'ergonomic office setup for long work hours' },
  { label: '13. Beauty essentials',             query: 'complete beauty essentials for daily use' },
  { label: '14. Sports & fitness',              query: 'home workout and fitness essentials' },
];

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

function fmt(n) {
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

async function runTest(test, i) {
  console.log(`\n${BOLD}${CYAN}─── ${test.label} ───${RESET}`);
  console.log(`${DIM}Query: "${test.query}"${RESET}`);
  const start = Date.now();

  try {
    const res = await fetch(`${BASE}/api/smart-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: test.query, orders: [] }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.log(`${RED}HTTP ${res.status}: ${err}${RESET}`);
      return { pass: false, test };
    }

    const data = await res.json();
    const elapsed = Date.now() - start;

    const pathType = data.bundle?.id === 'ai-generated' ? 'AI (llama-3.3-70b)' : data.setupType ? `deterministic(${data.setupType})` : 'keyword';

    if (data.bundle) {
      const b = data.bundle;
      const budgetOk = !data.budget || b.total <= data.budget;
      const statusIcon = budgetOk ? GREEN + '✅' : RED + '⚠️ ';
      console.log(`${statusIcon} Bundle: "${b.name}" ${b.icon}${RESET}`);
      console.log(`   ${DIM}${b.tagline}${RESET}`);
      console.log(`   Products (${b.products.length}):`);
      b.products.forEach(p => {
        console.log(`     • ${p.name}${RESET}`);
        console.log(`       ${DIM}${fmt(p.price)} | ${p.brand || '?'} | ${p.fullCategory || p.category}${RESET}`);
      });
      const budgetLine = data.budget
        ? `Budget: ${fmt(data.budget)} | Total: ${fmt(b.total)} | ${budgetOk ? GREEN + 'Within budget' : RED + 'OVER budget'}${RESET}`
        : `Total: ${fmt(b.total)} (no budget limit)`;
      console.log(`   ${budgetLine}`);
      if (b.whyReasons?.length) {
        console.log(`   Why: ${DIM}${b.whyReasons.join(' | ')}${RESET}`);
      }
      console.log(`   ${DIM}⏱ ${elapsed}ms | Path: ${pathType}${RESET}`);
      return { pass: true, test, bundle: b };
    } else {
      console.log(`${YELLOW}⚠️  No bundle returned${RESET}`);
      if (data.closestAlternative) {
        const ca = data.closestAlternative;
        console.log(`   Closest alternative: ${ca.name} — ${fmt(ca.total)} (over by ${fmt(ca.overBudgetBy)})`);
      }
      console.log(`   ${DIM}⏱ ${elapsed}ms | Path: ${pathType}${RESET}`);
      return { pass: false, test };
    }
  } catch (e) {
    console.log(`${RED}❌ Network/parse error: ${e.message}${RESET}`);
    return { pass: false, test, error: e.message };
  }
}

console.log(`${BOLD}AmazonLens Smart Search — Test Suite (${TESTS.length} queries)${RESET}`);
console.log(`Server: ${BASE} | Model: llama-3.3-70b-versatile (PRIMARY) with FAST fallback`);
console.log(`Delay between requests: ${DELAY_MS / 1000}s (Groq TPM guard)\n`);

const results = [];
for (let i = 0; i < TESTS.length; i++) {
  const r = await runTest(TESTS[i], i);
  results.push(r);
  if (i < TESTS.length - 1) {
    process.stdout.write(`\n${DIM}Waiting ${DELAY_MS / 1000}s for Groq TPM window...${RESET}`);
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    process.stdout.write('\r                                              \r');
  }
}

// Summary
const passed = results.filter(r => r.pass).length;
const failed = results.length - passed;
console.log(`\n${BOLD}═══ Results: ${GREEN}${passed} passed${RESET}${BOLD} / ${RED}${failed} failed${RESET}${BOLD} out of ${TESTS.length} tests ═══${RESET}`);
if (failed > 0) {
  console.log(`${RED}Failed:${RESET}`);
  results.filter(r => !r.pass).forEach(r => console.log(`  • ${r.test.label}: ${r.error || 'no bundle'}`));
}
