/* eslint-disable @typescript-eslint/no-explicit-any */
import { LeetCodeCN } from 'leetcode-query';
import fs from 'fs/promises';
import path from 'path';

// 从环境变量或默认值获取用户名
const USERNAME = process.env.LEETCODE_USERNAME || 'matthewhan';
const OUT_DIR = path.resolve(process.cwd(), 'stats');
const OUT_FILE = path.join(OUT_DIR, `${USERNAME}.svg`);
const OUT_JSON_FILE = path.join(OUT_DIR, `${USERNAME}.json`);

// 主题配置
const THEMES = {
    light: {
        card: '#ffffff',
        border: '#e1e4e8',
        text: '#24292e',
        textSecondary: '#586069',
        progressBg: '#f6f8fa',
        easy: '#00af9b',
        medium: '#ffb800',
        hard: '#ff2d55',
        success: '#00af9b',
        error: '#ff2d55',
        accent: '#0969da',
        background: '#f6f8fa'
    },
    dark: {
        card: '#0d1117',
        border: '#30363d',
        text: '#c9d1d9',
        textSecondary: '#8b949e',
        progressBg: '#21262d',
        easy: '#00af9b',
        medium: '#ffb800',
        hard: '#ff2d55',
        success: '#00af9b',
        error: '#ff2d55',
        accent: '#58a6ff',
        background: '#0d1117'
    },
    nord: {
        card: '#2e3440',
        border: '#434c5e',
        text: '#eceff4',
        textSecondary: '#d8dee9',
        progressBg: '#434c5e',
        easy: '#a3be8c',
        medium: '#ebcb8b',
        hard: '#bf616a',
        success: '#a3be8c',
        error: '#bf616a',
        accent: '#88c0d0',
        background: '#2e3440'
    }
};

// 获取主题
const THEME = process.env.THEME || 'light';
const currentTheme = THEMES[THEME] || THEMES.light;

// 辅助函数：转义HTML特殊字符
function esc(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

// 获取用户数据
async function getUserData() {
    const lc = new LeetCodeCN();
    
    try {
        // 尝试使用 user 方法获取基本信息
        const userProfile = await lc.user(USERNAME);
        console.log('User profile data:', JSON.stringify(userProfile, null, 2));
        
        // 获取最近活动记录（不是提交记录）
        let recentActivities = [];
        try {
            // 尝试获取用户活动记录
            const activities = await lc.user_activity(USERNAME);
            console.log('User activities:', JSON.stringify(activities, null, 2));
            recentActivities = activities || [];
        } catch (e) {
            console.log('Could not get user activities:', e.message);
            // 如果获取活动失败，使用提交记录作为备选
            const recentSubmissions = await lc.recent_submissions(USERNAME, 5);
            console.log('Using submissions as activities:', JSON.stringify(recentSubmissions, null, 2));
            recentActivities = recentSubmissions || [];
        }
        
        // 尝试获取用户进度问题列表（需要认证）
        let progressQuestions = null;
        try {
            progressQuestions = await lc.user_progress_questions({
                skip: 0,
                limit: 10
            });
            console.log('Progress questions:', JSON.stringify(progressQuestions, null, 2));
        } catch (e) {
            console.log('Could not get progress questions (requires auth):', e.message);
        }
        
        // 从用户资料中提取数据
        const progress = userProfile.userProfileUserQuestionProgress;
        const user = userProfile.userProfilePublicProfile;
        
        const easySolved = progress.numAcceptedQuestions.find(x => x.difficulty === 'EASY')?.count || 0;
        const mediumSolved = progress.numAcceptedQuestions.find(x => x.difficulty === 'MEDIUM')?.count || 0;
        const hardSolved = progress.numAcceptedQuestions.find(x => x.difficulty === 'HARD')?.count || 0;
        
        const easyTotal = easySolved + 
            (progress.numFailedQuestions.find(x => x.difficulty === 'EASY')?.count || 0) +
            (progress.numUntouchedQuestions.find(x => x.difficulty === 'EASY')?.count || 0);
        const mediumTotal = mediumSolved + 
            (progress.numFailedQuestions.find(x => x.difficulty === 'MEDIUM')?.count || 0) +
            (progress.numUntouchedQuestions.find(x => x.difficulty === 'MEDIUM')?.count || 0);
        const hardTotal = hardSolved + 
            (progress.numFailedQuestions.find(x => x.difficulty === 'HARD')?.count || 0) +
            (progress.numUntouchedQuestions.find(x => x.difficulty === 'HARD')?.count || 0);
        
        const totalSolved = easySolved + mediumSolved + hardSolved;
        const totalQuestions = easyTotal + mediumTotal + hardTotal;
        
        return {
            username: user.profile.userSlug,
            realname: user.profile.realName,
            avatar: user.profile.userAvatar,
            ranking: user.siteRanking,
            easy: { solved: easySolved, total: easyTotal },
            medium: { solved: mediumSolved, total: mediumTotal },
            hard: { solved: hardSolved, total: hardTotal },
            totalSolved,
            totalQuestions,
            recentActivities,
            progressQuestions,
            skillTags: user.profile.skillTags || [],
            location: user.profile.globalLocation,
            skillSet: user.profile.skillSet
        };
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

// 构建SVG图像
function buildSVG(data) {
    const { username, realname, ranking, easy, medium, hard, totalSolved, totalQuestions } = data;
    const cardWidth = 500;
    const cardHeight = 200;
    const barWidth = 300;

    const easyProgress = (easy.solved / easy.total) * barWidth;
    const mediumProgress = (medium.solved / medium.total) * barWidth;
    const hardProgress = (hard.solved / hard.total) * barWidth;

    // 计算圆形进度条
    const progressPercentage = totalSolved / totalQuestions;
    const circumference = 2 * Math.PI * 40; // 半径40
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - progressPercentage);

    return `
<svg width="${cardWidth}" height="${cardHeight}" viewBox="0 0 ${cardWidth} ${cardHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="leetcode-stats-title">
    <title id="leetcode-stats-title">${esc(username)} | LeetCode Stats Card</title>
    <style>
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes drawBar { from { stroke-dasharray: 0 10000 } to { stroke-dasharray: VAR_LEN 10000 } }
      @keyframes drawRing { from { stroke-dashoffset: ${circumference} } to { stroke-dashoffset: ${strokeDashoffset} } }
      #username-text, #ranking { opacity: 0; animation: fadeIn 0.4s ease 0.15s forwards }
      #icon { opacity: 0; animation: fadeIn 0.4s ease 0s forwards }
    </style>
    
    <!-- 卡片背景 -->
    <rect x="0.5" y="0.5" rx="4" width="${cardWidth - 1}" height="${cardHeight - 1}" fill="#fff" stroke="#e5e5e5" stroke-width="1"/>
    
    <!-- LeetCode图标 -->
    <g id="icon" transform="translate(20, 15) scale(0.27)">
        <g stroke="none" fill="#000000" fill-rule="evenodd">
            <path d="M67.506,83.066 C70.000,80.576 74.037,80.582 76.522,83.080 C79.008,85.578 79.002,89.622 76.508,92.112 L65.435,103.169 C55.219,113.370 38.560,113.518 28.172,103.513 C28.112,103.455 23.486,98.920 8.227,83.957 C-1.924,74.002 -2.936,58.074 6.616,47.846 L24.428,28.774 C33.910,18.621 51.387,17.512 62.227,26.278 L78.405,39.362 C81.144,41.577 81.572,45.598 79.361,48.342 C77.149,51.087 73.135,51.515 70.395,49.300 L54.218,36.217 C48.549,31.632 38.631,32.262 33.739,37.500 L15.927,56.572 C11.277,61.552 11.786,69.574 17.146,74.829 C28.351,85.816 36.987,94.284 36.997,94.294 C42.398,99.495 51.130,99.418 56.433,94.123 L67.506,83.066 Z" fill="#FFA116"/>
            <path d="M49.412,2.023 C51.817,-0.552 55.852,-0.686 58.423,1.722 C60.994,4.132 61.128,8.173 58.723,10.749 L15.928,56.572 C11.277,61.551 11.786,69.573 17.145,74.829 L36.909,94.209 C39.425,96.676 39.468,100.719 37.005,103.240 C34.542,105.760 30.506,105.804 27.990,103.336 L8.226,83.956 C-1.924,74.002 -2.936,58.074 6.617,47.846 L49.412,2.023 Z" fill="#000000"/>
            <path d="M40.606,72.001 C37.086,72.001 34.231,69.142 34.231,65.614 C34.231,62.087 37.086,59.228 40.606,59.228 L87.624,59.228 C91.145,59.228 94,62.087 94,65.614 C94,69.142 91.145,72.001 87.624,72.001 L40.606,72.001 Z" fill="#B3B3B3"/>
        </g>
    </g>
    
    <!-- 用户名 -->
    <a href="https://leetcode.cn/${username}/" target="_blank">
        <text id="username-text" x="65" y="40" fill="#000000" font-size="24" font-weight="bold">${esc(realname || username)}</text>
    </a>
    
    <!-- 排名 -->
    <text id="ranking" x="480" y="40" fill="#808080" font-size="18" font-weight="bold" text-anchor="end">#${esc(ranking || 'N/A')}</text>
    
    <!-- 左侧圆形进度条 -->
    <g transform="translate(30, 85)">
        <circle cx="40" cy="40" r="40" fill="none" stroke="#e5e5e5" stroke-width="6"/>
        <circle cx="40" cy="40" r="40" fill="none" stroke="#ffa116" stroke-width="6" 
                stroke-dasharray="${strokeDasharray}" 
                stroke-dashoffset="${circumference}"
                transform="rotate(-90 40 40)" stroke-linecap="round">
            <animate attributeName="stroke-dashoffset" from="${circumference}" to="${strokeDashoffset}" dur="0.8s" begin="0.2s" fill="freeze" />
        </circle>
        <text x="40" y="40" font-size="28" font-weight="bold" fill="#000000" text-anchor="middle" dominant-baseline="central">${totalSolved}</text>
    </g>
    
    <!-- 右侧难度进度条 -->
    <g transform="translate(160, 80)">
        <!-- Easy -->
        <g transform="translate(0, 0)">
            <text x="0" y="0" fill="#000000" font-size="18" font-weight="bold">Easy</text>
            <text x="300" y="0" fill="#808080" font-size="16" font-weight="bold" text-anchor="end">${easy.solved} / ${easy.total}</text>
            <line x1="0" y1="10" x2="300" y2="10" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>
            <line x1="0" y1="10" x2="300" y2="10" stroke="#5cb85c" stroke-width="4" stroke-dasharray="0 10000" stroke-linecap="round">
              <animate attributeName="stroke-dasharray" from="0 10000" to="${easyProgress} 10000" dur="0.6s" begin="0.35s" fill="freeze" />
            </line>
        </g>
        
        <!-- Medium -->
        <g transform="translate(0, 40)">
            <text x="0" y="0" fill="#000000" font-size="18" font-weight="bold">Medium</text>
            <text x="300" y="0" fill="#808080" font-size="16" font-weight="bold" text-anchor="end">${medium.solved} / ${medium.total}</text>
            <line x1="0" y1="10" x2="300" y2="10" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>
            <line x1="0" y1="10" x2="300" y2="10" stroke="#f0ad4e" stroke-width="4" stroke-dasharray="0 10000" stroke-linecap="round">
              <animate attributeName="stroke-dasharray" from="0 10000" to="${mediumProgress} 10000" dur="0.6s" begin="0.55s" fill="freeze" />
            </line>
        </g>
        
        <!-- Hard -->
        <g transform="translate(0, 80)">
            <text x="0" y="0" fill="#000000" font-size="18" font-weight="bold">Hard</text>
            <text x="300" y="0" fill="#808080" font-size="16" font-weight="bold" text-anchor="end">${hard.solved} / ${hard.total}</text>
            <line x1="0" y1="10" x2="300" y2="10" stroke="#e5e5e5" stroke-width="4" stroke-linecap="round"/>
            <line x1="0" y1="10" x2="300" y2="10" stroke="#d9534f" stroke-width="4" stroke-dasharray="0 10000" stroke-linecap="round">
              <animate attributeName="stroke-dasharray" from="0 10000" to="${hardProgress} 10000" dur="0.6s" begin="0.75s" fill="freeze" />
            </line>
        </g>
    </g>
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

// 写元数据 JSON（如 totalSolved），用于工作流判断是否需要 push
async function writeJsonIfChanged(filePath, obj) {
    const content = JSON.stringify(obj, null, 2);
    try {
        const existingContent = await fs.readFile(filePath, 'utf8');
        if (existingContent === content) {
            console.log('JSON content unchanged. Skipping file write.');
            return;
        }
    } catch (e) {
        // 文件不存在，继续写入
    }
    await fs.writeFile(filePath, content);
    console.log(`JSON written to ${filePath}`);
}

// 主函数
async function main() {
    try {
        await ensureOutDir(OUT_DIR);
        console.log(`Fetching data for user: ${USERNAME}`);
        console.log(`Using theme: ${THEME}`);
        const userData = await getUserData();

        const svgContent = buildSVG(userData);
        await writeIfChanged(OUT_FILE, svgContent);

        // 写入元数据 JSON，供 CI 判断是否 push
        const meta = {
            username: userData.username,
            totalSolved: userData.totalSolved,
            totalQuestions: userData.totalQuestions,
            easy: userData.easy,
            medium: userData.medium,
            hard: userData.hard,
            ranking: userData.ranking,
            generatedAt: new Date().toISOString()
        };
        await writeJsonIfChanged(OUT_JSON_FILE, meta);

        console.log('Operation completed successfully.');
    } catch (e) {
        console.error('An error occurred:', e.message);
        process.exit(1);
    }
}

main();