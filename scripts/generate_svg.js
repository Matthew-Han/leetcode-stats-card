import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const USERNAME = process.env.LEETCODE_USERNAME || 'matthewhan';
const OUT_DIR = path.resolve(process.cwd(), 'stats');
const OUT_FILE = path.join(OUT_DIR, `${USERNAME}.svg`);
const GQL_URL = 'https://leetcode.cn/graphql';

// 辅助函数：转义HTML特殊字符
function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// 辅助函数：带重试机制的fetch
async function fetchWithRetry(url, opts = {}, retries = 3, backoff = 800) {
    for (let i = 0; i < retries; i++) {
        try {
            const r = await fetch(url, opts);
            if (!r.ok) {
                // 如果是404，可能是用户名错误，直接抛出，不再重试
                if (r.status === 404) {
                    throw new Error(`User not found or HTTP ${r.status}`);
                }
                throw new Error(`HTTP ${r.status}`);
            }
            return r;
        } catch (e) {
            console.warn(`Fetch attempt ${i + 1} failed: ${e.message}. Retrying...`);
            if (i === retries - 1) throw e;
            await new Promise(res => setTimeout(res, backoff * (i + 1)));
        }
    }
}

// 新的 GraphQL 查询，仅获取用户提交统计（更稳定）
async function getUserSubmissionStats(username) {
    const body = {
        query: `query userSolutionStats($username: String!) {
            matchedUser(username: $username) {
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
            'Referer': `https://leetcode.cn/u/${username}/`,
            'User-Agent': 'Mozilla/5.0 (compatible; LeetCode-Stats-Card/3.0)'
        },
        body: JSON.stringify(body)
    }, 3, 600);

    const json = await resp.json();
    if (!json || !json.data || !json.data.matchedUser) {
        throw new Error('No matched user data in response. Please check the username.');
    }
    return json.data.matchedUser;
}

// 构建SVG图像
function buildSVG(userData) {
    const { acSubmissionNum } = userData.submitStats;

    const easy = acSubmissionNum.find(d => d.difficulty === 'Easy')?.count || 0;
    const medium = acSubmissionNum.find(d => d.difficulty === 'Medium')?.count || 0;
    const hard = acSubmissionNum.find(d => d.difficulty === 'Hard')?.count || 0;
    const total = easy + medium + hard;

    return `
        <svg width="400" height="150" xmlns="http://www.w3.org/2000/svg" style="font-family: sans-serif;">
            <style>
                .title { font-size: 18px; font-weight: bold; }
                .label { font-size: 14px; }
                .value { font-size: 16px; font-weight: bold; }
            </style>
            <rect x="0" y="0" width="100%" height="100%" rx="10" ry="10" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
            
            <text x="10" y="30" class="title">${esc(USERNAME)} 的力扣统计</text>
            
            <text x="10" y="60" class="label">总通过题目数:</text>
            <text x="130" y="60" class="value" fill="#007BFF">${total}</text>
            
            <text x="10" y="80" class="label">简单:</text>
            <text x="60" y="80" class="value" fill="#4CAF50">${easy}</text>
            
            <text x="10" y="100" class="label">中等:</text>
            <text x="60" y="100" class="value" fill="#FFC107">${medium}</text>
            
            <text x="10" y="120" class="label">困难:</text>
            <text x="60" y="120" class="value" fill="#F44336">${hard}</text>
        </svg>
    `;
}

// 确保输出目录存在
async function ensureOutDir(dir) {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (e) {
        console.error('Failed to create directory:', e);
        process.exit(1);
    }
}

// 写入文件，如果内容未改变则不写入
async function writeIfChanged(filePath, content) {
    try {
        const existingContent = await fs.readFile(filePath, 'utf8');
        if (existingContent === content) {
            console.log('SVG content unchanged. Skipping file write.');
            return;
        }
    } catch (e) {
        // 文件不存在，这是预期的，继续写入
    }
    await fs.writeFile(filePath, content);
    console.log(`SVG written to ${filePath}`);
}

// 主函数
async function main() {
    try {
        await ensureOutDir(OUT_DIR);
        console.log(`Fetching data for user: ${USERNAME}`);
        // 使用新的函数
        const userData = await getUserSubmissionStats(USERNAME);

        const svgContent = buildSVG(userData);
        await writeIfChanged(OUT_FILE, svgContent);

        console.log('Operation completed successfully.');
    } catch (e) {
        console.error('An error occurred:', e.message);
        process.exit(1);
    }
}

main();