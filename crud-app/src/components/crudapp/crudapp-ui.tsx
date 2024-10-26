"use client";

import { Keypair, PublicKey } from "@solana/web3.js";
import { useMemo, useState } from "react";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import {
  useCrudappProgram,
  useCrudappProgramAccount,
} from "./crudapp-data-access";
import { useWallet } from "@solana/wallet-adapter-react";
import toast from "react-hot-toast";
import { IconCaretUpDown, IconRefresh, IconTrash } from "@tabler/icons-react";

export function CrudappCreate() {
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const { createEntry } = useCrudappProgram();
  const { publicKey } = useWallet();

  const isFormValid = title.trim() && message.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!isFormValid || !publicKey) {
      setError('Please fill out all fields')
      return
    }
    createEntry.mutateAsync({ title, message, owner: publicKey });
  };

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Please connect your wallet to continue
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Create Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title
          </label>
          <input
            type="text"
            id="title"
            placeholder="Enter title"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            aria-describedby="title-error"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Message
          </label>
          <textarea
            id="message"
            placeholder="Enter message"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={4}
            aria-describedby="message-error"
          />
        </div>
        {error && (
          <p id="form-error" className="text-red-500 text-sm mt-2" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          disabled={!isFormValid || createEntry.isPending}
          aria-busy={createEntry.isPending}
        >
          {createEntry.isPending ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
}

export function CrudappList() {
  const { accounts, getProgramAccount } = useCrudappProgram();

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
        <div className="grid md:grid-cols-2 gap-4 pb-20">
          {accounts.data?.map((account) => (
            <CrudappCard
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

export default function CrudappCard({ account }: { account: PublicKey }) {
  const { accountQuery, updateJournalEntry, deleteJournalEntry } = useCrudappProgramAccount({ account })
  const { publicKey } = useWallet()
  const [message, setMessage] = useState<string>("")
  const title = accountQuery.data?.title
  const isFormValid = title && message.trim()

  const handleSubmit = () => {
    if (!isFormValid || !publicKey) {
      toast.error("Please fill out all fields")
      return
    }
    updateJournalEntry.mutateAsync({ title, message })
  }

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-64 bg-base-200 rounded-lg">
        <p className="text-lg font-semibold text-base-content">Please connect your wallet</p>
      </div>
    )
  }

  if (accountQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-base-200 rounded-lg">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="card-title text-2xl font-bold">{accountQuery.data?.title}</h2>
            <button
              className="btn btn-ghost btn-circle"
              onClick={() => accountQuery.refetch()}
              aria-label="Refresh"
            >
              <IconRefresh className="w-5 h-5" />
            </button>
          </div>
          <p className="text-base-content/80">{accountQuery.data?.message}</p>
          <div className="space-y-4">
            <textarea
              placeholder="Update your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="textarea textarea-bordered w-full h-24 resize-none"
            ></textarea>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={handleSubmit}
                disabled={!isFormValid || updateJournalEntry.isPending}
                className="btn btn-primary"
              >
                <IconCaretUpDown className="w-4 h-4 mr-2" />
                Update Entry
              </button>
              <button
                onClick={() => {
                  const title = accountQuery.data?.title
                  if (title) {
                    return deleteJournalEntry.mutateAsync({ title })
                  }
                }}
                disabled={deleteJournalEntry.isPending}
                className="btn btn-error"
              >
                <IconTrash className="w-4 h-4 mr-2" />
                Delete Journal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}