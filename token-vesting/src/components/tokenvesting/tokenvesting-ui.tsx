"use client";

import { Keypair, PublicKey } from "@solana/web3.js";
import { useMemo, useState } from "react";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import {
  useTokenvestingProgram,
  useTokenvestingProgramAccount,
} from "./tokenvesting-data-access";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";

export function TokenvestingCreate() {
  const { createVestingAccount } = useTokenvestingProgram();
  const [companyName, setCompanyName] = useState<string>("");
  const [mint, setMint] = useState<string>("");
  const { publicKey } = useWallet();

  const isFormValid = companyName.length && mint.length;

  const handleSubmit = () => {
    if (!isFormValid || !publicKey) {
      toast.error("Please fill out all fields");
      return;
    }

    createVestingAccount.mutateAsync({ companyName, mint });
  }

  if (!publicKey) {
    return (
      <div className="alert alert-warning">
        <span>
          You need to connect your wallet to create a vesting account.
        </span>
      </div>
    );
  }


  return (
    <div>
      <input 
        className="input input-bordered w-full max-w-xs"
        placeholder="Company Name"
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
      />
      <input 
        className="input input-bordered w-full max-w-xs"
        placeholder="Mint"
        value={mint}
        onChange={(e) => setMint(e.target.value)}
      />

      <button
      className="btn btn-xs lg:btn-md btn-primary"
      onClick={handleSubmit}
      disabled={createVestingAccount.isPending || !isFormValid}
    >
      Create new vesting account {createVestingAccount.isPending && "..."}
    </button>
    </div>
    
  );
}

export function TokenvestingList() {
  const { accounts, getProgramAccount } = useTokenvestingProgram();

  if (getProgramAccount.isLoading) {
    return <span className="loading loading-spinner loading-lg"></span>;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info flex justify-center">
        <span>
          Program account not found. Make sure you have deployed the program and
          are on the correct cluster.
        </span>
      </div>
    );
  }
  return (
    <div className={"space-y-6"}>
      {accounts.isLoading ? (
        <span className="loading loading-spinner loading-lg"></span>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {accounts.data?.map((account) => (
            <TokenvestingCard
              key={account.publicKey.toString()}
              account={account.publicKey}
            />
          ))}
        </div>
      ) : (
        <div className="text-center">
          <h2 className={"text-2xl"}>No accounts</h2>
          No accounts found. Create one above to get started.
        </div>
      )}
    </div>
  );
}

function TokenvestingCard({ account }: { account: PublicKey }) {
  const {
    accountQuery,
    createEmployeeVesting
  } = useTokenvestingProgramAccount({
    account,
  });

  const [startTime, setStartTime] = useState<number>(0);
  const [endTime, setEndTime] = useState<number>(0);
  const [cliffTime, setCliffTime] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  const companyName = useMemo(() => accountQuery.data?.companyName, [accountQuery.data?.companyName]);

  return accountQuery.isLoading ? (
    <span className="loading loading-spinner loading-lg"></span>
  ) : (
    <div className="card card-bordered border-base-300 border-4 text-neutral-content">
      <div className="card-body items-center text-center">
        <div className="space-y-6">
          <h2
            className="card-title justify-center text-3xl cursor-pointer"
            onClick={() => accountQuery.refetch()}
          >
            {companyName}
          </h2>
          <div className="card-actions justify-around">
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => incrementMutation.mutateAsync()}
              disabled={incrementMutation.isPending}
            >
              Increment
            </button>
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => {
                const value = window.prompt(
                  "Set value to:",
                  count.toString() ?? "0",
                );
                if (
                  !value ||
                  parseInt(value) === count ||
                  isNaN(parseInt(value))
                ) {
                  return;
                }
                return setMutation.mutateAsync(parseInt(value));
              }}
              disabled={setMutation.isPending}
            >
              Set
            </button>
            <button
              className="btn btn-xs lg:btn-md btn-outline"
              onClick={() => decrementMutation.mutateAsync()}
              disabled={decrementMutation.isPending}
            >
              Decrement
            </button>
          </div>
          <div className="text-center space-y-4">
            <p>
              <ExplorerLink
                path={`account/${account}`}
                label={ellipsify(account.toString())}
              />
            </p>
            <button
              className="btn btn-xs btn-secondary btn-outline"
              onClick={() => {
                if (
                  !window.confirm(
                    "Are you sure you want to close this account?",
                  )
                ) {
                  return;
                }
                return closeMutation.mutateAsync();
              }}
              disabled={closeMutation.isPending}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
