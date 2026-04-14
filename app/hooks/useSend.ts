import { TOKENS, PLATFORM_TREASURY, PLATFORM_FEE_BPS } from "@/app/utils/constants";
import { TIP20_ABI } from "@/app/utils/abis";
import { useAccount, useWalletClient } from "wagmi";
import { useState } from "react";
import { parseUnits, type Address } from "viem";

const usdcAddress = TOKENS.USDC as Address;
const treasuryAddress = PLATFORM_TREASURY as Address;

export function useSend() {
    const { address, isConnected } = useAccount();
    const { data: walletClient } = useWalletClient();
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<string | null>(null);

    const send = async (to: string, amount: string, memo: string = "") => {
        if (isSending) return;
        setIsSending(true);
        setError(null);
        setTxHash(null);

        if (!isConnected || !address || !walletClient) {
            const errMsg = "No active wallet. Please connect your wallet first.";
            setError(errMsg);
            setIsSending(false);
            throw new Error(errMsg);
        }

        try {
            const recipient = await getAddress(to);
            const totalWei = parseUnits(amount, 6); // USDC = 6 decimals

            // Calculate 5% platform fee
            const feeWei = (totalWei * BigInt(PLATFORM_FEE_BPS)) / BigInt(10000);
            const creatorWei = totalWei - feeWei;

            // Transfer to creator (95%)
            console.log('[useSend] Sending to creator...');
            const tx = await walletClient.writeContract({
                address: usdcAddress,
                abi: TIP20_ABI,
                functionName: "transfer",
                args: [recipient, creatorWei],
            });

            // Transfer fee to treasury (5%)
            if (feeWei > BigInt(0)) {
                console.log('[useSend] Sending platform fee...');
                await walletClient.writeContract({
                    address: usdcAddress,
                    abi: TIP20_ABI,
                    functionName: "transfer",
                    args: [treasuryAddress, feeWei],
                });
            }

            console.log('[useSend] Transaction hash:', tx);
            setTxHash(tx);
            return tx;
        } catch (err) {
            console.error('[useSend] Error:', err);
            const errorMessage =
                err instanceof Error ? err.message : "Failed to send";
            setError(errorMessage);
            throw err;
        } finally {
            setIsSending(false);
        }
    };

    return {
        send,
        isSending,
        error,
        txHash,
        reset: () => {
            setError(null);
            setTxHash(null);
        },
    };
}

async function getAddress(to: string): Promise<Address> {
    if (to.startsWith('0x') && to.length === 42) return to as Address;

    const res = await fetch("/api/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: to }),
    });

    if (!res.ok) throw new Error("Failed to find user");

    const data = (await res.json()) as { address: Address };
    return data.address;
}
