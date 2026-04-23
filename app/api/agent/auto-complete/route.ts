import { NextResponse } from 'next/server';
import { db } from '@/utils/db';
import { createPublicClient, createWalletClient, http, parseUnits, type Address } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arcTestnet } from '@/utils/arc-config';
import { ERC8183_CONTRACT_ADDRESS, TOKENS } from '@/app/utils/constants';

// Agent wallet — uses the fee payer key as the AI agent's wallet
function getAgentAccount() {
    const key = process.env.FEE_PAYER_PRIVATE_KEY;
    if (!key) return null;
    return privateKeyToAccount(key as `0x${string}`);
}

async function callDeepSeek(prompt: string, systemPrompt: string) {
    if (!process.env.DEEPSEEK_API_KEY) {
        return `AI-generated deliverable: Task completed based on description. [mock response - set DEEPSEEK_API_KEY for real AI]`;
    }
    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            max_tokens: 512,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ]
        })
    });
    const result = await response.json();
    return result.choices?.[0]?.message?.content || 'Deliverable generated.';
}

// POST: Trigger autonomous agent to find and complete open jobs
export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const jobId = body.jobId; // Optional: specific job to complete

        const agentAccount = getAgentAccount();
        if (!agentAccount) {
            return NextResponse.json({ error: 'Agent wallet not configured (FEE_PAYER_PRIVATE_KEY missing)' }, { status: 500 });
        }

        // Find an open job; if none exist (demo scenario on a freshly reset
        // platform), synthesize one so the AI agent always has something to
        // complete. This keeps the demo step meaningful whether or not real
        // supporters have requested commissions yet.
        let job;
        if (jobId) {
            job = await db.jobs.getById(jobId);
            if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        } else {
            const openJobs = await db.jobs.getAll('open');
            if (openJobs.length === 0) {
                const demoTitles = [
                    'Write a 200-word intro to ZK rollups',
                    'Summarize the Arc Network architecture',
                    'Draft release notes for v0.3',
                    'Explain x402 nanopayments to a non-crypto audience',
                ];
                const pick = demoTitles[Math.floor(Math.random() * demoTitles.length)];
                job = await db.jobs.create({
                    onchainId: null,
                    creatorAddress: agentAccount.address,
                    requesterAddress: body.requester || agentAccount.address,
                    title: pick,
                    description: 'Demo commission auto-spawned because the platform had no open jobs. AI agent will draft and submit a deliverable against this record.',
                    budget: 1,
                    txHash: null,
                });
                console.log('[auto-complete] spawned demo commission:', job.id);
            } else {
                job = openJobs[0];
            }
        }

        const steps: string[] = [];

        // Step 1: Claim the job in DB
        await db.jobs.update(job.id, { status: 'claimed', claimedBy: agentAccount.address });
        steps.push(`Claimed job: "${job.title}" (ID: ${job.id})`);

        // Step 2: Generate deliverable with AI
        const deliverable = await callDeepSeek(
            `Complete this job:\nTitle: ${job.title}\nDescription: ${job.description}\nBudget: $${job.budget} USDC\n\nProvide a concise, high-quality deliverable.`,
            'You are an autonomous AI agent completing jobs on a creator platform. Provide direct, actionable deliverables. No JSON formatting needed, just the result.'
        );
        steps.push(`AI generated deliverable (${deliverable.length} chars)`);

        // Step 3: Submit to DB
        await db.jobs.update(job.id, {
            status: 'submitted',
            submissionResult: deliverable,
        });
        steps.push('Submission recorded in database');

        // Step 4: Try onchain submit via ERC-8183 (if job has onchainId)
        let onchainTx = null;
        if (job.onchainId) {
            try {
                const client = createWalletClient({
                    account: agentAccount,
                    chain: arcTestnet,
                    transport: http(),
                });

                // Convert deliverable to bytes32 hash
                const { keccak256, toBytes } = await import('viem');
                const deliverableHash = keccak256(toBytes(deliverable));

                const ERC8183_SUBMIT_ABI = [{
                    inputs: [
                        { name: 'jobId', type: 'uint256' },
                        { name: 'deliverable', type: 'bytes32' },
                        { name: 'params', type: 'bytes' },
                        { name: 'fee', type: 'uint256' }
                    ],
                    name: 'submit',
                    outputs: [],
                    stateMutability: 'nonpayable',
                    type: 'function'
                }] as const;

                onchainTx = await client.writeContract({
                    address: ERC8183_CONTRACT_ADDRESS as Address,
                    abi: ERC8183_SUBMIT_ABI,
                    functionName: 'submit',
                    args: [BigInt(job.onchainId), deliverableHash, '0x' as `0x${string}`, BigInt(0)],
                });

                steps.push(`Onchain submit tx: ${onchainTx}`);
            } catch (err: any) {
                steps.push(`Onchain submit skipped: ${err.message?.slice(0, 100)}`);
            }
        } else {
            steps.push('No onchainId — offchain submission only');
        }

        return NextResponse.json({
            success: true,
            agentAddress: agentAccount.address,
            job: {
                id: job.id,
                title: job.title,
                budget: job.budget,
            },
            deliverable: deliverable.slice(0, 500),
            onchainTx,
            steps,
        });

    } catch (error: any) {
        console.error('Auto-complete error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Show agent status and available jobs
export async function GET() {
    const agentAccount = getAgentAccount();
    const openJobs = await db.jobs.getAll('open');
    const completedJobs = await db.jobs.getAll('completed');

    return NextResponse.json({
        agent: {
            address: agentAccount?.address || 'not configured',
            status: agentAccount ? 'active' : 'inactive',
        },
        openJobs: openJobs.length,
        completedJobs: completedJobs.length,
        jobs: openJobs.slice(0, 10).map((j: any) => ({
            id: j.id,
            title: j.title,
            budget: j.budget,
        })),
    });
}
