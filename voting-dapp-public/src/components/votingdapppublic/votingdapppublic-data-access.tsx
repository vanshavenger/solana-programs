'use client'

import {getVotingdapppublicProgram, getVotingdapppublicProgramId} from '@project/anchor'
import {useConnection} from '@solana/wallet-adapter-react'
import {Cluster, Keypair, PublicKey} from '@solana/web3.js'
import {useMutation, useQuery} from '@tanstack/react-query'
import {useMemo} from 'react'
import toast from 'react-hot-toast'
import {useCluster} from '../cluster/cluster-data-access'
import {useAnchorProvider} from '../solana/solana-provider'
import {useTransactionToast} from '../ui/ui-layout'

export function useVotingdapppublicProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getVotingdapppublicProgramId(cluster.network as Cluster), [cluster])
  const program = getVotingdapppublicProgram(provider)

  const accounts = useQuery({
    queryKey: ['votingdapppublic', 'all', { cluster }],
    queryFn: () => program.account.votingdapppublic.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['votingdapppublic', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      program.methods.initialize().accounts({ votingdapppublic: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useVotingdapppublicProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useVotingdapppublicProgram()

  const accountQuery = useQuery({
    queryKey: ['votingdapppublic', 'fetch', { cluster, account }],
    queryFn: () => program.account.votingdapppublic.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['votingdapppublic', 'close', { cluster, account }],
    mutationFn: () => program.methods.close().accounts({ votingdapppublic: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['votingdapppublic', 'decrement', { cluster, account }],
    mutationFn: () => program.methods.decrement().accounts({ votingdapppublic: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['votingdapppublic', 'increment', { cluster, account }],
    mutationFn: () => program.methods.increment().accounts({ votingdapppublic: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['votingdapppublic', 'set', { cluster, account }],
    mutationFn: (value: number) => program.methods.set(value).accounts({ votingdapppublic: account }).rpc(),
    onSuccess: (tx) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
