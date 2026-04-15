import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { useState } from "react";
import { parseUnits, type Address } from "viem";
import { ERC8183_ABI, TIP20_ABI } from "@/app/utils/abis";
import { ERC8183_CONTRACT_ADDRESS, TOKENS } from "@/app/utils/constants";

const usdcAddress = TOKENS.USDC as Address;
const contractAddress = ERC8183_CONTRACT_ADDRESS as Address;

export function useJob() {
    const { address, isConnected } = useAccount();
    const { data: walletClient, refetch: refetchWalletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const ensureWallet = async () => {
        if (!isConnected || !address) {
            throw new Error("No active wallet. Please connect your wallet first.");
        }
        let wc = walletClient;
        if (!wc) {
            for (let i = 0; i < 5; i++) {
                await new Promise(r => setTimeout(r, 300));
                const refreshed = await refetchWalletClient();
                if (refreshed.data) { wc = refreshed.data; break; }
            }
        }
        if (!wc) throw new Error("Wallet client not ready. Refresh the page.");
        return wc;
    };

    const createJob = async (
        provider: string,
        evaluator: string,
        expiry: bigint,
        description: string
    ) => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);
        setTxHash(null);

        const wc = await ensureWallet();

        try {
            console.log('[useJob] Creating job...');
            const tx = await wc.writeContract({
                address: contractAddress,
                abi: ERC8183_ABI,
                functionName: "createJob",
                args: [
                    provider as Address,
                    evaluator as Address,
                    expiry,
                    description,
                    "0x0000000000000000000000000000000000000000" as Address,
                ],
            });

            console.log('[useJob] Job created! Tx:', tx);
            setTxHash(tx);
            return tx;
        } catch (err) {
            console.error('[useJob] createJob error:', err);
            const errorMessage = err instanceof Error ? err.message : "Failed to create job";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const fundJob = async (jobId: bigint, budget: string) => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);
        setTxHash(null);

        const wc = await ensureWallet();

        try {
            const amountInWei = parseUnits(budget, 6);

            // Step 1: Set budget on the job
            console.log('[useJob] Setting budget...');
            await wc.writeContract({
                address: contractAddress,
                abi: ERC8183_ABI,
                functionName: "setBudget",
                args: [jobId, amountInWei],
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 2: Approve USDC spend
            console.log('[useJob] Approving USDC spend...');
            await wc.writeContract({
                address: usdcAddress,
                abi: TIP20_ABI,
                functionName: "approve",
                args: [contractAddress, amountInWei],
            });

            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 3: Fund the job
            console.log('[useJob] Funding job...');
            const tx = await wc.writeContract({
                address: contractAddress,
                abi: ERC8183_ABI,
                functionName: "fund",
                args: [jobId],
            });

            console.log('[useJob] Job funded! Tx:', tx);
            setTxHash(tx);
            return tx;
        } catch (err) {
            console.error('[useJob] fundJob error:', err);
            const errorMessage = err instanceof Error ? err.message : "Failed to fund job";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const submitWork = async (jobId: bigint, deliverable: `0x${string}`) => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);
        setTxHash(null);

        const wc = await ensureWallet();

        try {
            console.log('[useJob] Submitting work...');
            const tx = await wc.writeContract({
                address: contractAddress,
                abi: ERC8183_ABI,
                functionName: "submit",
                args: [jobId, deliverable, "0x" as `0x${string}`, BigInt(0)],
            });

            console.log('[useJob] Work submitted! Tx:', tx);
            setTxHash(tx);
            return tx;
        } catch (err) {
            console.error('[useJob] submitWork error:', err);
            const errorMessage = err instanceof Error ? err.message : "Failed to submit work";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const completeJob = async (jobId: bigint, reason: `0x${string}`) => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);
        setTxHash(null);

        const wc = await ensureWallet();

        try {
            console.log('[useJob] Completing job...');
            const tx = await wc.writeContract({
                address: contractAddress,
                abi: ERC8183_ABI,
                functionName: "complete",
                args: [jobId, reason],
            });

            console.log('[useJob] Job completed! Tx:', tx);
            setTxHash(tx);
            return tx;
        } catch (err) {
            console.error('[useJob] completeJob error:', err);
            const errorMessage = err instanceof Error ? err.message : "Failed to complete job";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const rejectJob = async (jobId: bigint, reason: `0x${string}`) => {
        if (isLoading) return;
        setIsLoading(true);
        setError(null);
        setTxHash(null);

        const wc = await ensureWallet();

        try {
            console.log('[useJob] Rejecting job...');
            const tx = await wc.writeContract({
                address: contractAddress,
                abi: ERC8183_ABI,
                functionName: "reject",
                args: [jobId, reason],
            });

            console.log('[useJob] Job rejected! Tx:', tx);
            setTxHash(tx);
            return tx;
        } catch (err) {
            console.error('[useJob] rejectJob error:', err);
            const errorMessage = err instanceof Error ? err.message : "Failed to reject job";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const getJob = async (jobId: bigint) => {
        if (!publicClient) throw new Error("No public client available");

        const job = await publicClient.readContract({
            address: contractAddress,
            abi: ERC8183_ABI,
            functionName: "getJob",
            args: [jobId],
        });

        return job;
    };

    return {
        createJob,
        fundJob,
        submitWork,
        completeJob,
        rejectJob,
        getJob,
        isLoading,
        error,
        txHash,
    };
}
