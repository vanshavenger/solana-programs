"use client";

import { getCrudappProgram, getCrudappProgramId } from "@project/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { Cluster, Keypair, PublicKey } from "@solana/web3.js";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import toast from "react-hot-toast";
import { useCluster } from "../cluster/cluster-data-access";
import { useAnchorProvider } from "../solana/solana-provider";
import { useTransactionToast } from "../ui/ui-layout";

interface CreateEntryArgs {
  title: string;
  message: string;
  owner: PublicKey;
}

export function useCrudappProgram() {
  const { connection } = useConnection();
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const provider = useAnchorProvider();
  const programId = useMemo(
    () => getCrudappProgramId(cluster.network as Cluster),
    [cluster],
  );
  const program = getCrudappProgram(provider);

  const accounts = useQuery({
    queryKey: ["crudapp", "all", { cluster }],
    queryFn: () => program.account.journalEntryState.all(),
  });

  const getProgramAccount = useQuery({
    queryKey: ["get-program-account", { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  });

  const createEntry = useMutation<string, Error, CreateEntryArgs>({
    mutationKey: ["journalEntry", "create-entry", { cluster }],
    mutationFn: async ({ title, message }) => {
      return program.methods.createJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature), accounts.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    createEntry,
  };
}

export function useCrudappProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster();
  const transactionToast = useTransactionToast();
  const { program, accounts } = useCrudappProgram();

  const accountQuery = useQuery({
    queryKey: ["crudapp", "fetch", { cluster, account }],
    queryFn: () => program.account.journalEntryState.fetch(account),
  });

  const updateJournalEntry = useMutation<
    string,
    Error,
    Omit<CreateEntryArgs, "owner">
  >({
    mutationKey: ["journalEntry", "update-entry", { cluster }],
    mutationFn: async ({ title, message }) => {
      return program.methods.updateJournalEntry(title, message).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature), accounts.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteJournalEntry = useMutation<
    string,
    Error,
    Omit<CreateEntryArgs, "message" | "owner">
  >({
    mutationKey: ["journalEntry", "delete-entry", { cluster }],
    mutationFn: async ({ title }) => {
      return program.methods.deleteJournalEntry(title).rpc();
    },
    onSuccess: (signature) => {
      transactionToast(signature), accounts.refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return {
    accountQuery,
    updateJournalEntry,
    deleteJournalEntry,
  };
}
