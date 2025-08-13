// scripts/generate_svg.js
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const USER = process.env.LEETCODE_USERNAME || 'matthewhan';
const OUT_DIR = path.resolve(process.cwd(), 'stats');
const OUT_FILE = path.join(OUT_DIR, `${USER}.svg`);
const GQL_URL = 'https://leetcode.cn/graphql';

function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function fetchWithRetry(url, opts = {}, retries = 3, backoff = 800) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, opts);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r;
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise(res => setTimeout(res, backoff * (i + 1)));
    }
  }
}

async function getUserData(username) {
  const body = {
    query: `query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          userAvatar
          realName
          ranking
          reputation
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }`,
    variables: { username }
  };

  const resp = await fetchWithRetry(GQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://leetcode.cn',
      'Referer': 'https://leetcode.cn',
      'User-Agent': 'Mozilla/5.0 (compatible; LeetCode-Stats-Card/1.0)'
    },
    body: JSON.stringify(body)
  }, 3, 600);

  const json = await resp.json();
  if (!json || !json.data || !json.data.matchedUser) {
    throw new Error('no matchedUser in response');
  }
  return json.data.matchedUser;
}

function buildSVG(user) {
  const username = user.username || '';
  const avatar = user.profile?.userAvatar || '';
  const ranking = user.profile?.ranking ?? '—';
  const reputation = user.profile?.reputation ?? '—';

  let easy = 0, medium = 0, hard = 0;
  const arr = user.submitStats?.acSubmissionNum || [];
  for (const item of arr) {
    if (!item) continue;
    if (item.difficulty === 'Easy') easy = item.count || 0;
    if (item.difficulty === 'Medium') medium = item.count || 0;
    if (item.difficulty === 'Hard') hard = item.count || 0;
  }
  const total = easy + medium + hard;

  const w = 560, h = 128;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <style>
    .bg{fill:#0b1226}
    .card{fill:#0f1724; stroke:#111827; stroke-width:1}
    .title{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial; font-size:18px; fill:#E6EEF8; font-weight:700}
    .meta{font-family:ui-sans-serif,system-ui; font-size:12px; fill:#9FB3C8}
    .stat{font-family:ui-sans-serif,system-ui; font-size:14px; fill:#DCEFFF; font-weight:600}
    .small{font-size:11px; fill:#9FB3C8}
  </style>

  <rect class="bg" width="100%" height="100%" rx="12" />
  <g transform="translate(12,12)">
    <rect class="card" x="0" y="0" width="${w-24}" height="${h-24}" rx="10" />
    <clipPath id="av">
      <circle cx="56" cy="48" r="34" />
    </clipPath>
    <image href="${esc(avatar)}" x="22" y="14" width="68" height="68" clip-path="url(#av)" preserveAspectRatio="xMidYMid slice" />
    <text class="title" x="110" y="36">${esc(username)} · LeetCode-cn</text>
    <text class="meta" x="110" y="56">排名：${esc(ranking)}  ·  贡献：${esc(reputation)}</text>

    <g transform="translate(110,74)">
      <text class="stat" x="0" y="0">Solved ${esc(total)}</text>
      <text class="small" x="130" y="0">Easy ${esc(easy)}</text>
      <text class="small" x="220" y="0">Medium ${esc(medium)}</text>
      <text class="small" x="320" y="0">Hard ${esc(hard)}</text>
    </g>

    <text class="small" x="${w-140}" y="${h-44}" text-anchor="end">Updated: ${new Date().toLocaleString('zh-CN')}</text>
  </g>
</svg>`;
  return svg;
}

async function ensureOutDir() {
  try {
    await fs.mkdir(OUT_DIR, { recursive: true });
  } catch (e) { /* ignore */ }
}

async function writeIfChanged(file, content) {
  try {
    const prev = await fs.readFile(file, 'utf8');
    if (prev === content) {
      console.log('No changes to svg; skip writing.');
      return false;
    }
  } catch (e) {
    // file not exist -> write
  }
  await fs.writeFile(file, content, 'utf8');
  return true;
}

async function main() {
  try {
    console.log('Fetch user:', USER);
    const user = await getUserData(USER);
    const svg = buildSVG(user);
    await ensureOutDir();
    const changed = await writeIfChanged(OUT_FILE, svg);
    if (changed) {
      console.log('Wrote svg to', OUT_FILE);
      process.exit(0);
    } else {
      process.exit(0);
    }
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(2);
  }
}

main();

