"use client";

import { getFavoritesProgram, getFavoritesProgramId } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";

export function useFavoritesProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getFavoritesProgramId(cluster.network as Cluster),
    [cluster],
  );
  const program = getFavoritesProgram(provider);

  const accounts = useQuery({
    queryKey: ["favorites", "all", { cluster }],
    queryFn: () => program.account.favorites.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const initialize = useMutation({
    mutationKey: ["favorites", "initialize", { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods
        .initialize()
        .accounts({ favorites: keypair.publicKey })
        .signers([keypair])
        .rpc(),
    onSuccess: (signature) => {
      transactionToast(signature);
      return accounts.refetch();
    },
    onError: () => toast.error("Failed to initialize account"),
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  };
}

export function useFavoritesProgramAccount({
  account,
}: {
  account: PublicKey;
}) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useFavoritesProgram();

  const accountQuery = useQuery({
    queryKey: ["favorites", "fetch", { cluster, account }],
    queryFn: () => program.account.favorites.fetch(account),
  });

  const closeMutation = useMutation({
    mutationKey: ["favorites", "close", { cluster, account }],
    mutationFn: () =>
      program.methods.close().accounts({ favorites: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accounts.refetch();
    },
  });

  const decrementMutation = useMutation({
    mutationKey: ["favorites", "decrement", { cluster, account }],
    mutationFn: () =>
      program.methods.decrement().accounts({ favorites: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accountQuery.refetch();
    },
  });

  const incrementMutation = useMutation({
    mutationKey: ["favorites", "increment", { cluster, account }],
    mutationFn: () =>
      program.methods.increment().accounts({ favorites: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accountQuery.refetch();
    },
  });

  const setMutation = useMutation({
    mutationKey: ["favorites", "set", { cluster, account }],
    mutationFn: (value: number) =>
      program.methods.set(value).accounts({ favorites: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx);
      return accountQuery.refetch();
    },
  });

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  };
}
