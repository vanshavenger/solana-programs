"use client"

import { PublicKey } from "@solana/web3.js"
import { useMemo, useState } from "react"
import { useTokenvestingProgram, useTokenvestingProgramAccount } from "./tokenvesting-data-access"
import { useWallet } from "@solana/wallet-adapter-react"
import { toast } from "react-hot-toast"

export default function TokenVesting() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-4xl font-bold mb-8 text-center text-primary">Token Vesting Dashboard</h1>
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
      <div className="alert alert-warning shadow-lg mb-8" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>You need to connect your wallet to create a vesting account.</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card bg-base-200 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-6">Create New Vesting Account</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="form-control">
            <label className="label" htmlFor="companyName">
              <span className="label-text">Company Name</span>
            </label>
            <input
              id="companyName"
              className="input input-bordered w-full"
              placeholder="Enter company name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="mint">
              <span className="label-text">Mint</span>
            </label>
            <input
              id="mint"
              className="input input-bordered w-full"
              placeholder="Enter mint address"
              value={mint}
              onChange={(e) => setMint(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="card-actions justify-end mt-6">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={createVestingAccount.isPending || !isFormValid}
          >
            {createVestingAccount.isPending ? (
              <>
                <span className="loading loading-spinner"></span>
                Creating...
              </>
            ) : (
              "Create Vesting Account"
            )}
          </button>
        </div>
      </div>
    </form>
  )
}

export function TokenvestingList() {
  const { accounts, getProgramAccount } = useTokenvestingProgram()

  if (getProgramAccount.isLoading) {
    return <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg"></span></div>
  }

  if (!getProgramAccount.data?.value) {
    return (
      <div className="alert alert-info shadow-lg" role="alert">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Program account not found. Make sure you have deployed the program and are on the correct cluster.</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-semibold mb-6 text-center">Vesting Accounts</h2>
      {accounts.isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : accounts.data?.length ? (
        <div className="grid md:grid-cols-2 gap-8">
          {accounts.data?.map((account) => (
            <TokenvestingCard key={account.publicKey.toString()} account={account.publicKey} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-base-200 rounded-lg">
          <h3 className="text-2xl font-semibold mb-2">No accounts found</h3>
          <p className="text-gray-600">Create a new vesting account to get started.</p>
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
      <div className="card bg-base-100 shadow-xl animate-pulse">
        <div className="card-body">
          <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-2xl mb-6 text-primary cursor-pointer" onClick={() => accountQuery.refetch()}>
          {companyName}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 mb-6">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key} className="form-control">
                <label htmlFor={key} className="label">
                  <span className="label-text capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                </label>
                <input
                  id={key}
                  name={key}
                  className="input input-bordered w-full"
                  placeholder={`Enter ${key.replace(/([A-Z])/g, " $1").trim().toLowerCase()}`}
                  value={value}
                  onChange={handleInputChange}
                  required
                />
              </div>
            ))}
          </div>
          <div className="card-actions justify-end">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={createEmployeeVesting.isPending || !isFormValid}
            >
              {createEmployeeVesting.isPending ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Creating...
                </>
              ) : (
                "Create Employee Vesting"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}