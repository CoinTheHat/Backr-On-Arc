import { useState, useCallback, useEffect } from "react";
import { useAccount, useWalletClient, usePublicClient } from "wagmi";
import { parseUnits, formatUnits, type Address, type Hex } from "viem";
import { TOKENS } from "@/app/utils/constants";
import {
  CHAIN_CONFIGS,
  registerBatchScheme,
} from "@circle-fin/x402-batching/client";
import { x402Client, x402HTTPClient } from "@x402/core/client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARC_TESTNET_CONFIG = CHAIN_CONFIGS.arcTestnet;
const GATEWAY_WALLET = ARC_TESTNET_CONFIG.gatewayWallet;
const USDC_ADDRESS = TOKENS.USDC as Address;

/** Minimal ERC-20 ABI for approve + allowance */
const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** Minimal Gateway Wallet ABI for deposit + balance reads */
const GATEWAY_WALLET_ABI = [
  {
    name: "deposit",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "initiateWithdrawal",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "withdraw",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "token", type: "address" },
    ],
    outputs: [],
  },
  {
    name: "availableBalance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "depositor", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "totalBalance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "token", type: "address" },
      { name: "depositor", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NanopayState {
  isLoading: boolean;
  error: string | null;
  balance: string | null; // formatted USDC (e.g. "12.50")
  balanceRaw: bigint | null;
}

export interface NanopayActions {
  /** Deposit USDC into the Circle Gateway Wallet (one on-chain tx). */
  deposit: (amount: string) => Promise<Hex>;
  /** Initiate withdrawal of USDC from Gateway Wallet back to user wallet. */
  withdraw: (amount: string) => Promise<Hex>;
  /** Refresh the gateway balance. */
  getBalance: () => Promise<string>;
  /**
   * Pay for x402-gated content. Attempts the gasless batching flow first,
   * then falls back to a direct USDC transfer if the resource does not
   * support batching.
   */
  payForContent: <T = unknown>(
    url: string,
    options?: { method?: string; body?: unknown; headers?: Record<string, string> },
  ) => Promise<{ data: T; amount: string }>;
  /** Clear error state. */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNanopay(): NanopayState & NanopayActions {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [balanceRaw, setBalanceRaw] = useState<bigint | null>(null);

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  const requireWallet = useCallback(() => {
    if (!isConnected || !address || !walletClient) {
      throw new Error("No active wallet. Please connect your wallet first.");
    }
    return { address, walletClient };
  }, [isConnected, address, walletClient]);

  // -----------------------------------------------------------------------
  // getBalance — reads available gateway balance on-chain
  // -----------------------------------------------------------------------

  const getBalance = useCallback(async (): Promise<string> => {
    const { address: addr } = requireWallet();
    if (!publicClient) throw new Error("Public client not available");

    const raw = (await publicClient.readContract({
      address: GATEWAY_WALLET,
      abi: GATEWAY_WALLET_ABI,
      functionName: "availableBalance",
      args: [USDC_ADDRESS, addr],
    })) as bigint;

    const formatted = formatUnits(raw, 6);
    setBalance(formatted);
    setBalanceRaw(raw);
    return formatted;
  }, [requireWallet, publicClient]);

  // -----------------------------------------------------------------------
  // deposit — approve + deposit USDC into gateway wallet
  // -----------------------------------------------------------------------

  const deposit = useCallback(
    async (amount: string): Promise<Hex> => {
      const { address: addr, walletClient: wc } = requireWallet();
      if (!publicClient) throw new Error("Public client not available");

      setIsLoading(true);
      setError(null);

      try {
        const depositAmount = parseUnits(amount, 6);

        // 1. Check current allowance
        const allowance = (await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "allowance",
          args: [addr, GATEWAY_WALLET],
        })) as bigint;

        // 2. Approve if needed
        if (allowance < depositAmount) {
          console.log("[useNanopay] Approving gateway wallet...");
          const approveTx = await wc.writeContract({
            address: USDC_ADDRESS,
            abi: ERC20_ABI,
            functionName: "approve",
            args: [GATEWAY_WALLET, depositAmount],
          });
          await publicClient.waitForTransactionReceipt({ hash: approveTx });
          console.log("[useNanopay] Approval confirmed:", approveTx);
        }

        // 3. Check wallet has enough USDC before depositing
        const walletBal = (await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "balanceOf",
          args: [addr],
        })) as bigint;
        if (walletBal < depositAmount) {
          throw new Error(`Insufficient USDC. You have $${formatUnits(walletBal, 6)}, trying to deposit $${amount}`);
        }

        // 4. Deposit into gateway
        console.log("[useNanopay] Depositing into gateway...");
        const depositTx = await wc.writeContract({
          address: GATEWAY_WALLET,
          abi: GATEWAY_WALLET_ABI,
          functionName: "deposit",
          args: [USDC_ADDRESS, depositAmount],
        });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: depositTx });
        if (receipt.status !== 'success') {
          throw new Error(`Deposit transaction reverted. See ${depositTx} on ArcScan for details.`);
        }
        console.log("[useNanopay] Deposit confirmed:", depositTx);

        // 4. Refresh balance
        await getBalance();

        return depositTx;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Deposit failed";
        console.error("[useNanopay] Deposit error:", err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [requireWallet, publicClient, getBalance],
  );

  // -----------------------------------------------------------------------
  // withdraw — initiate withdrawal from Gateway Wallet back to user wallet
  // -----------------------------------------------------------------------

  const withdraw = useCallback(
    async (amount: string): Promise<Hex> => {
      const { walletClient: wc } = requireWallet();

      setIsLoading(true);
      setError(null);
      try {
        const withdrawAmount = parseUnits(amount, 6);
        console.log(`[useNanopay] Initiating withdrawal of ${amount} USDC from Gateway...`);

        const txHash = await wc.writeContract({
          address: GATEWAY_WALLET,
          abi: GATEWAY_WALLET_ABI,
          functionName: "initiateWithdrawal",
          args: [USDC_ADDRESS, withdrawAmount],
        });

        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: txHash });
        }

        console.log("[useNanopay] Withdrawal initiated:", txHash);

        // Refresh balance
        await getBalance();

        return txHash;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Withdrawal failed";
        console.error("[useNanopay] Withdraw error:", err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [requireWallet, publicClient, getBalance],
  );

  // -----------------------------------------------------------------------
  // payForContent — gasless x402 flow using BatchEvmScheme
  // -----------------------------------------------------------------------

  const payForContent = useCallback(
    async <T = unknown>(
      url: string,
      options?: { method?: string; body?: unknown; headers?: Record<string, string> },
    ): Promise<{ data: T; amount: string }> => {
      const { address: addr, walletClient: wc } = requireWallet();

      setIsLoading(true);
      setError(null);

      try {
        const method = options?.method ?? "GET";

        // 1. Make initial request
        const initRes = await fetch(url, {
          method,
          headers: options?.headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        // Not a paywall — return directly
        if (initRes.status !== 402) {
          const data = (await initRes.json()) as T;
          return { data, amount: "0" };
        }

        // 2. Parse 402 response to get payment requirements
        const paymentRequired = await initRes.json();
        const requirements = paymentRequired?.paymentRequirements ?? paymentRequired?.accepts;

        if (!requirements || !Array.isArray(requirements) || requirements.length === 0) {
          throw new Error("Server returned 402 but no payment requirements found");
        }

        // 3. Build a wagmi-compatible signer that satisfies BatchEvmSigner
        const signer = {
          address: addr,
          signTypedData: async (params: {
            domain: {
              name: string;
              version: string;
              chainId: number;
              verifyingContract: Address;
            };
            types: Record<string, Array<{ name: string; type: string }>>;
            primaryType: string;
            message: Record<string, unknown>;
          }): Promise<Hex> => {
            return wc.signTypedData({
              account: addr,
              domain: params.domain,
              types: params.types,
              primaryType: params.primaryType,
              message: params.message,
            });
          },
        };

        // 4. Create x402 client with batch scheme registered
        const baseClient = new x402Client();
        registerBatchScheme(baseClient, { signer });
        const httpClient = new x402HTTPClient(baseClient);

        // 5. Parse the 402 response into a PaymentRequired structure
        const paymentRequiredObj = httpClient.getPaymentRequiredResponse(
          (name: string) => initRes.headers.get(name),
          paymentRequired,
        );

        // 6. Find a batching-compatible requirement for amount display
        const batchReq = paymentRequiredObj.accepts.find(
          (r) => r.extra && (r.extra as Record<string, unknown>).name === "GatewayWalletBatched",
        );

        if (!batchReq) {
          throw new Error(
            "No Gateway batching option available for this resource. " +
              "The server may only support direct on-chain payments.",
          );
        }

        // 7. Create payment payload and encode as HTTP headers
        const paymentPayload = await httpClient.createPaymentPayload(paymentRequiredObj);
        const paymentHeaders = httpClient.encodePaymentSignatureHeader(paymentPayload);

        // 8. Retry with payment header
        const retryRes = await fetch(url, {
          method,
          headers: {
            ...options?.headers,
            ...paymentHeaders,
          },
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        if (!retryRes.ok) {
          throw new Error(`Payment accepted but resource returned ${retryRes.status}`);
        }

        const data = (await retryRes.json()) as T;
        const paidAmount = batchReq.amount
          ? formatUnits(BigInt(batchReq.amount), 6)
          : "unknown";

        // Refresh balance after payment
        getBalance().catch(() => {});

        return { data, amount: paidAmount };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Payment failed";
        console.error("[useNanopay] Payment error:", err);
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [requireWallet, getBalance],
  );

  // -----------------------------------------------------------------------
  // Reset
  // -----------------------------------------------------------------------

  const reset = useCallback(() => {
    setError(null);
  }, []);

  // -----------------------------------------------------------------------
  // Auto-fetch balance on wallet connect
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (isConnected && address && publicClient) {
      getBalance().catch(() => {});
    }
  }, [isConnected, address, publicClient, getBalance]);

  return {
    // State
    isLoading,
    error,
    balance,
    balanceRaw,
    // Actions
    deposit,
    withdraw,
    getBalance,
    payForContent,
    reset,
  };
}
