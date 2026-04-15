import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { useState } from "react";
import { parseUnits, type Address } from "viem";
import { SUBSCRIPTION_CONTRACT_ABI, TIP20_ABI } from "@/app/utils/abis";
import { SUBSCRIPTION_FACTORY_ADDRESS, TOKENS } from "@/app/utils/constants";

const usdcAddress = TOKENS.USDC as Address;

interface SubscribeParams {
    contractAddress: string;
    tierId: number;
    amount: string;
    memo?: string;
}

export function useSubscribe() {
    const { address, isConnected } = useAccount();
    const { data: walletClient, refetch: refetchWalletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const subscribe = async ({ contractAddress, tierId, amount, memo }: SubscribeParams) => {
        if (isSubscribing) return;
        setIsSubscribing(true);
        setError(null);
        setTxHash(null);

        if (!isConnected || !address) {
            const errMsg = "No active wallet. Please connect your wallet first.";
            setError(errMsg);
            setIsSubscribing(false);
            throw new Error(errMsg);
        }

        // Wait for walletClient with retries
        let wc = walletClient;
        if (!wc) {
            for (let i = 0; i < 5; i++) {
                await new Promise(r => setTimeout(r, 300));
                const refreshed = await refetchWalletClient();
                if (refreshed.data) { wc = refreshed.data; break; }
            }
        }
        if (!wc) {
            const errMsg = "Wallet client not ready. Please refresh the page.";
            setError(errMsg);
            setIsSubscribing(false);
            throw new Error(errMsg);
        }

        try {
            // Step 1: Approve the token (USDC 6 decimals)
            const amountInWei = parseUnits(amount, 6);

            console.log('[useSubscribe] Approving token spend...');
            await wc.writeContract({
                address: usdcAddress,
                abi: TIP20_ABI,
                functionName: "approve",
                args: [contractAddress as Address, amountInWei],
            });

            // Wait for approval confirmation
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 2: Subscribe via contract
            console.log('[useSubscribe] Subscribing to tier...');
            const subscribeTx = await wc.writeContract({
                address: contractAddress as Address,
                abi: SUBSCRIPTION_CONTRACT_ABI,
                functionName: "subscribe",
                args: [BigInt(tierId)],
            });

            console.log('[useSubscribe] Subscription successful! Tx:', subscribeTx);
            setTxHash(subscribeTx);
            return subscribeTx;
        } catch (err) {
            console.error('[useSubscribe] Error:', err);
            const errorMessage =
                err instanceof Error ? err.message : "Failed to subscribe";
            setError(errorMessage);
            throw err;
        } finally {
            setIsSubscribing(false);
        }
    };

    const getCreatorContract = async (creatorAddress: string): Promise<string> => {
        if (!publicClient) throw new Error("No public client available");

        const contractAddress = await publicClient.readContract({
            address: SUBSCRIPTION_FACTORY_ADDRESS as Address,
            abi: [
                {
                    inputs: [{ internalType: "address", name: "_creator", type: "address" }],
                    name: "getProfile",
                    outputs: [{ internalType: "address", name: "", type: "address" }],
                    stateMutability: "view",
                    type: "function"
                }
            ],
            functionName: "getProfile",
            args: [creatorAddress as Address],
        }) as Address;

        return contractAddress;
    };

    return {
        subscribe,
        getCreatorContract,
        isSubscribing,
        error,
        txHash,
        reset: () => {
            setError(null);
            setTxHash(null);
        },
    };
}
