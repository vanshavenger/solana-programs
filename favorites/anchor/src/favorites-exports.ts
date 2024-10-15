// Here we export some useful types and functions for interacting with the Anchor program.
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Cluster, PublicKey } from "@solana/web3.js";
import FavoritesIDL from "../target/idl/favorites.json";
import type { Favorites } from "../target/types/favorites";

// Re-export the generated IDL and type
export { Favorites, FavoritesIDL };

// The programId is imported from the program IDL.
export const FAVORITES_PROGRAM_ID = new PublicKey(FavoritesIDL.address);

// This is a helper function to get the Favorites Anchor program.
export function getFavoritesProgram(provider: AnchorProvider) {
  return new Program(FavoritesIDL as Favorites, provider);
}

// This is a helper function to get the program ID for the Favorites program depending on the cluster.
export function getFavoritesProgramId(cluster: Cluster) {
  switch (cluster) {
    case "devnet":
    case "testnet":
      // This is the program ID for the Favorites program on devnet and testnet.
      return new PublicKey("CounNZdmsQmWh7uVngV9FXW2dZ6zAgbJyYsvBpqbykg");
    case "mainnet-beta":
    default:
      return FAVORITES_PROGRAM_ID;
  }
}
