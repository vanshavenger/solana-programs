// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { Cluster, PublicKey } from '@solana/web3.js'
import VotingdapppublicIDL from '../target/idl/votingdapppublic.json'
import type { Votingdapppublic } from '../target/types/votingdapppublic'

// Re-export the generated IDL and type
export { Votingdapppublic, VotingdapppublicIDL }

// The programId is imported from the program IDL.
export const VOTINGDAPPPUBLIC_PROGRAM_ID = new PublicKey(VotingdapppublicIDL.address)

// This is a helper function to get the Votingdapppublic Anchor program.
export function getVotingdapppublicProgram(provider: AnchorProvider) {
  return new Program(VotingdapppublicIDL as Votingdapppublic, provider)
}

// This is a helper function to get the program ID for the Votingdapppublic program depending on the cluster.
export function getVotingdapppublicProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':
      // This is the program ID for the Votingdapppublic program on devnet and testnet.
      return new PublicKey('CounNZdmsQmWh7uVngV9FXW2dZ6zAgbJyYsvBpqbykg')
    case 'mainnet-beta':
    default:
      return VOTINGDAPPPUBLIC_PROGRAM_ID
  }
}
