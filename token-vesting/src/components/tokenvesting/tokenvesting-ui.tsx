'use client'

import { PublicKey } from "@solana/web3.js"
import { useMemo, useState } from "react"
import { useTokenvestingProgram, useTokenvestingProgramAccount } from "./tokenvesting-data-access"
import { useWallet } from "@solana/wallet-adapter-react"
import { toast } from "react-hot-toast"

export default function TokenVesting() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-gray-800 dark:text-white">Token Vesting Dashboard</h1>
      <TokenvestingCreate />
      <TokenvestingList />
    </div>
  )
}

export function TokenvestingCreate() {
  const { createVestingAccount } = useTokenvestingProgram()
  const [companyName, setCompanyName] = useState("")
  const [mint, setMint] = useState("")
  const { publicKey } = useWallet()

  const isFormValid = companyName.length > 0 && mint.length > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || !publicKey) {
      toast.error("Please fill out all fields")
      return
    }

    toast.promise(createVestingAccount.mutateAsync({ companyName, mint }), {
      loading: "Creating vesting account...",
      success: "Vesting account created successfully!",
      error: "Failed to create vesting account",
    })
  }

  if (!publicKey) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-8" role="alert">
        <p className="font-bold">Warning</p>
        <p>You need to connect your wallet to create a vesting account.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">Create New Vesting Account</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Company Name
          </label>
          <input
            id="companyName"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="mint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mint
          </label>
          <input
            id="mint"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter mint address"
            value={mint}
            onChange={(e) => setMint(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="mt-6 text-right">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={createVestingAccount.isPending || !isFormValid}
        >
          {createVestingAccount.isPending ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : (
            "Create Vesting Account"
          )}
        </button>
      </div>
    </form>
  )
}

export function TokenvestingList() {
  const { accounts, getProgramAccount } = useTokenvestingProgram()

  if (getProgramAccount.isLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>
  }

  if (!getProgramAccount.data?.value) {
    return (
      <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4" role="alert">
        <p className="font-bold">Info</p>
        <p>Program account not found. Make sure you have deployed the program and are on the correct cluster.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800 dark:text-white">Vesting Accounts</h2>
      {accounts.isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-8">
          {accounts.data?.map((account) => (
            <TokenvestingCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <h3 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-white">No accounts found</h3>
          <p className="text-gray-600 dark:text-gray-400">Create a new vesting account to get started.</p>
        </div>
      )}
    </div>
  )
}

export function TokenvestingCard({ account }: { account: PublicKey }) {
  const { accountQuery, createEmployeeVesting } = useTokenvestingProgramAccount({ account })
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    cliffTime: "",
    totalAmount: "",
    beneficiary: "",
  })

  const companyName = useMemo(() => accountQuery.data?.companyName, [accountQuery.data?.companyName])

  const isFormValid = Object.values(formData).every((value) => value.trim() !== "")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      toast.error("Please fill out all fields")
      return
    }

    toast.promise(
      createEmployeeVesting.mutateAsync({
        startTime: parseInt(formData.startTime),
        endTime: parseInt(formData.endTime),
        cliffTime: parseInt(formData.cliffTime),
        totalAmount: parseInt(formData.totalAmount),
        beneficiary: formData.beneficiary,
      }),
      {
        loading: "Creating employee vesting...",
        success: "Employee vesting created successfully!",
        error: "Failed to create employee vesting",
      }
    )
  }

  if (accountQuery.isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 animate-pulse">
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h3 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors" onClick={() => accountQuery.refetch()}>
        {companyName}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 mb-6">
          {Object.entries(formData).map(([key, value]) => (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </label>
              <input
                id={key}
                name={key}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").trim().toLowerCase()}`}
                value={value}
                onChange={handleInputChange}
                required
              />
            </div>
          ))}
        </div>
        <div className="text-right">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={createEmployeeVesting.isPending || !isFormValid}
          >
            {createEmployeeVesting.isPending ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : (
              "Create Employee Vesting"
            )}
          </button>
        </div>
      </form>
    </div>
  )
}