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
            'User-Agent': 'Mozilla/5.0 (compatible; LeetCode-Stats-Card/1.0)',
            'Cookie': `LEETCODE_SESSION=${process.env.LEETCODE_SESSION};`,
            'X-CSRFToken': process.env.LEETCODE_CSRF_TOKEN
        },
        body: JSON.stringify(body)
    }, 3, 600);

    const json = await resp.json();
    if (!json || !json.data || !json.data.matchedUser) {
        throw new Error('no matchedUser in response');
    }
    return json.data.matchedUser;
}

// buildSVG, ensureOutDir, writeIfChanged 和 main 保持原样
// 你原来的 buildSVG / ensureOutDir / writeIfChanged 函数可以直接复用
// main 函数不变，只是 fetch 时会自动带 cookie
