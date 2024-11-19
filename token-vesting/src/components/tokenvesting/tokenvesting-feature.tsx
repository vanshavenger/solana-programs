"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "../solana/solana-provider";
import { AppHero, ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useTokenvestingProgram } from "./tokenvesting-data-access";
import { TokenvestingCreate, TokenvestingList } from "./tokenvesting-ui";

export default function TokenvestingFeature() {
  const { publicKey } = useWallet();
  const { programId } = useTokenvestingProgram();

  return publicKey ? (
    <div className="container mx-auto px-4 py-8 mb-12">
      <AppHero
        title="Token Vesting Program"
        subtitle="Create a new token vesting program for your company."
      >
        <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Program ID:</p>
          <ExplorerLink
            path={`account/${programId}`}
            label={ellipsify(programId.toString())}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors"
          />
        </div>
        <TokenvestingCreate />
      </AppHero>
      <div className="mt-16">
        <TokenvestingList />
      </div>
    </div>
  ) : (
    <div className="max-w-4xl mx-auto min-h-screen flex items-center justify-center">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Welcome to Token Vesting</h2>
        <p className="mb-8 text-gray-600 dark:text-gray-300">Connect your wallet to get started with token vesting.</p>
        <WalletButton />
      </div>
    </div>
  );
}