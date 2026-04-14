import { NextResponse } from 'next/server';
import { db } from '@/utils/db';

async function callDeepSeek(prompt: string, systemPrompt?: string) {
    const messages: any[] = [];
    if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            max_tokens: 1024,
            messages
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${errorText}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || '';
}

function mockResponse(action: string, content?: string) {
    switch (action) {
        case 'moderate':
            return { score: 8, feedback: 'Content looks good. Clear and appropriate for the platform.' };
        case 'generate-description':
            return { description: `A compelling creative offering: ${(content || '').slice(0, 60)}...` };
        case 'complete-job':
            return { result: 'Task completed successfully with high quality output.', summary: 'The job deliverable has been generated based on the provided description.' };
        case 'chat':
            return { reply: 'AI chat is not configured. Please set DEEPSEEK_API_KEY in .env.local' };
        default:
            return { error: 'Unknown action' };
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, content, jobId, messages } = body;

        const validActions = ['moderate', 'generate-description', 'complete-job', 'chat'];
        if (!action || !validActions.includes(action)) {
            return NextResponse.json({ error: `Invalid action. Use: ${validActions.join(', ')}` }, { status: 400 });
        }

        // If no API key, return mock response
        if (!process.env.DEEPSEEK_API_KEY) {
            return NextResponse.json({
                action,
                mock: true,
                provider: 'mock',
                data: mockResponse(action, content)
            });
        }

        let prompt = '';
        let systemPrompt: string | undefined;

        if (action === 'moderate') {
            if (!content) return NextResponse.json({ error: 'Content is required for moderation' }, { status: 400 });
            systemPrompt = 'You are a content moderator for a creator platform. Always reply with valid JSON only.';
            prompt = `Rate this content for quality and appropriateness (1-10). Content: ${content}\n\nReply as JSON: {"score": number, "feedback": "string"}`;
        } else if (action === 'generate-description') {
            if (!content) return NextResponse.json({ error: 'Content is required' }, { status: 400 });
            systemPrompt = 'You are a creative writing assistant. Always reply with valid JSON only.';
            prompt = `Generate a short creative description for: ${content}\n\nReply as JSON: {"description": "string"}`;
        } else if (action === 'complete-job') {
            if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
            const job = await db.jobs.getById(jobId);
            if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
            systemPrompt = 'You are an AI agent completing jobs on a creator platform. Always reply with valid JSON only.';
            prompt = `Complete this job:\nTitle: ${job.title}\nDescription: ${job.description}\nBudget: $${job.budget} USDC\n\nProvide a deliverable result. Reply as JSON: {"result": "string", "summary": "string"}`;
        } else if (action === 'chat') {
            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                return NextResponse.json({ error: 'messages array is required for chat' }, { status: 400 });
            }
            const lastMessage = messages[messages.length - 1];

            // Fetch live site data to give AI real context
            let creatorsInfo = '';
            let statsInfo = '';
            let jobsInfo = '';
            try {
                const creators = await db.creators.getAll();
                if (creators.length > 0) {
                    // Fetch tiers for each creator to include in context
                    const creatorLines = await Promise.all(creators.map(async (c: any) => {
                        let tiersTxt = '';
                        try {
                            const tiers = await db.tiers.getByCreator(c.address);
                            if (tiers.length > 0) {
                                tiersTxt = ` | Tiers: ${tiers.map((t: any) => `${t.name}($${t.price})`).join(', ')}`;
                            }
                        } catch {}
                        return `- ${c.name || 'Unnamed'} (@${c.username || 'no-username'}) — ${c.bio || 'No bio'}${tiersTxt}`;
                    }));
                    creatorsInfo = '\n\nACTIVE CREATORS ON THE PLATFORM:\n' + creatorLines.join('\n');
                }
                const stats = await db.stats.getCounts();
                statsInfo = `\n\nPLATFORM STATS: ${stats.creators} creators, ${stats.posts} posts, ${stats.tips} tips, $${stats.volume.toFixed(2)} total volume`;

                const jobs = await db.jobs.getAll('open');
                if (jobs.length > 0) {
                    jobsInfo = '\n\nOPEN JOBS:\n' + jobs.slice(0, 5).map((j: any) =>
                        `- "${j.title}" — $${j.budget} USDC by ${(j.creatorAddress || '').slice(0, 8)}...`
                    ).join('\n');
                }
            } catch (e) {
                console.warn('Could not fetch site data for chat:', e);
            }

            const userContext = body.context || {};
            const isCreator = !!userContext.hasContract;
            const walletStatus = userContext.isConnected
                ? `User wallet: ${userContext.address?.slice(0, 10)}... (connected, role: ${isCreator ? 'CREATOR' : 'SUPPORTER'})`
                : 'User wallet: NOT CONNECTED';

            const creatorOnlyActions = `
CREATOR-ONLY EXECUTE ACTIONS (user IS a creator):
- create_tier: {"name":"Gold","price":"10"} — Creates subscription tier on-chain (30 day duration)
- create_post: {"title":"...","content":"...","ppvPrice":"0.005","isPublic":false} — Creates a post (use ppvPrice for pay-per-view, omit for free/members-only)
- create_commission: {"title":"...","description":"...","budget":"5"} — Creates on-chain commission for AI agents/freelancers
- withdraw_earnings: {} — Withdraws accumulated USDC from subscription contract (auto applies 5% fee)
`;

            const supporterActions = `
SUPPORTER EXECUTE ACTIONS (available to all users):
- deposit_gateway: {"amount":"5"} — Deposits USDC to Circle Gateway for gasless nanopayments
- withdraw_gateway: {"amount":"5"} — Withdraws USDC from Gateway back to wallet
- send_tip: {"to":"0x...","amount":"0.5"} — Sends direct USDC tip (5% platform fee applied)
- subscribe_tier: {"creator":"username","tier":"Gold"} — Subscribes to a creator's tier
- unlock_ppv: {"postId":"abc","amount":"0.005","creatorAddress":"0x..."} — Pays to unlock a PPV post
`;

            systemPrompt = `You are the AI agent for Backr, a creator membership platform on Arc Network (blockchain) with USDC payments and nanopayments.

${walletStatus}

You can do TWO types of things:

**1. NAVIGATE** — Suggest pages with clickable buttons:
[ACTION:Button Label|/path]

**2. EXECUTE ON-CHAIN ACTIONS** — Directly perform transactions without asking for confirmation:
[EXECUTE:action_type|{"param":"value"}]
${isCreator ? creatorOnlyActions + supporterActions : supporterActions + '\n\nNote: User is NOT a creator. If they ask to create tiers/posts/commissions, tell them to go to /onboarding first via [ACTION:Become a Creator|/onboarding].'}

CRITICAL EXECUTE RULES:
- Execute immediately without asking for confirmation — user approves in MetaMask
- For subscribe_tier: look up creator by name/username from ACTIVE CREATORS list in context
- For create_post: if user says "make a $0.005 PPV post about X", set ppvPrice and isPublic=false
- For create_commission: default budget is $1 if not specified
- Turkish triggers: "tier oluştur", "post at", "commission aç", "üye ol", "kazancımı çek", "withdraw et", "ödeme yap"
- English triggers: "create tier", "make a post", "subscribe to", "withdraw earnings", "deposit"
- Don't invent addresses — use creator context data for lookups
- If user doesn't specify a price, ask once. If they say "cheap" or "standard", use sensible defaults ($5 tier, $5 gateway deposit)
- ALWAYS confirm what you did AFTER executing, don't ask before
- Execute actions happen automatically with user's wallet — the user approves in MetaMask
- Include both explanation text AND the execute tag in same response

NAVIGATION:
- Create a new post: [ACTION:Create Post|/community/new-post]
- Manage subscription tiers: [ACTION:Manage Tiers|/community/manage-tiers]
- Dashboard overview: [ACTION:Dashboard|/dashboard]
- Check earnings: [ACTION:Earnings|/dashboard/earnings]
- Manage audience: [ACTION:Members|/dashboard/audience]
- Profile settings: [ACTION:Settings|/dashboard/settings]
- Browse creators: [ACTION:Explore Creators|/explore]
- Browse commissions: [ACTION:Browse Commissions|/jobs]
- Manage commissions: [ACTION:Manage Commissions|/dashboard/jobs]
- Nanopayments deposit: [ACTION:Nanopayments|/nanopayments]
- My memberships: [ACTION:My Memberships|/memberships]
- My feed: [ACTION:My Feed|/feed]
- Gas comparison: [ACTION:Why Nanopayments?|/about/gas-comparison]
- Connect wallet: [ACTION:Connect Wallet|/login]
- Become a creator: [ACTION:Become Creator|/onboarding]
${creatorsInfo}${statsInfo}${jobsInfo}

FEATURES TO EXPLAIN:
- Pay-Per-View: Creators can set per-post pricing ($0.001-$0.01 USDC). Supporters pay per view with gasless nanopayments.
- Subscriptions: Monthly tiers stored on-chain. Subscribers get access to all tier-gated content.
- Tips: Direct USDC tips to any creator. 95% goes to creator, 5% platform fee.
- Jobs (ERC-8183): Creators post jobs, agents/freelancers complete them, payment escrowed on-chain.
- AI Agent: Can auto-complete jobs, moderate content, generate descriptions.
- Nanopayments: Circle x402 protocol — gasless USDC micro-payments after one-time deposit.
- All on Arc Testnet — sub-second finality, USDC as gas token.

RULES:
- Keep responses short (2-3 sentences)
- ALWAYS suggest relevant actions with [ACTION:] buttons
- When asked to recommend creators, list REAL creators from the data above with their profile links
- When asked about stats, use REAL numbers from above
- Be friendly, helpful, and action-oriented
- Answer in the same language the user writes in (Turkish, English, etc.)`;

            prompt = lastMessage.content;

            const aiText = await callDeepSeek(prompt, systemPrompt);
            return NextResponse.json({
                action: 'chat',
                mock: false,
                provider: 'deepseek',
                data: { reply: aiText }
            });
        }

        const aiText = await callDeepSeek(prompt, systemPrompt);

        // Parse JSON response
        let parsed;
        try {
            const jsonMatch = aiText.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: aiText };
        } catch {
            parsed = { raw: aiText };
        }

        return NextResponse.json({
            action,
            mock: false,
            provider: 'deepseek',
            data: parsed
        });

    } catch (error: any) {
        console.error('Agent API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
