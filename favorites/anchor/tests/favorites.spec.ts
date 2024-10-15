import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { Favorites } from "../target/types/favorites";
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";
const IDL = require("../target/idl/favorites.json");
// import {expect, beforeAll, it, describe} from "bun:test"

const favoriteAddress = new PublicKey(
  "AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ"
);

describe("favorites", () => {
  it("Initialize Favorites", async () => {
    const userKeypair = Keypair.generate();
    console.log("User Public Key:", userKeypair.publicKey.toBase58());

    try {
      const context = await startAnchor(
        "",
        [
          {
            name: "favorites",
            programId: favoriteAddress,
          },
        ],
        [],
      );

      console.log("Bankrun context started");

      const provider = new BankrunProvider(context);
      console.log("BankrunProvider created");

      const favoriteProgram = new Program<Favorites>(
        IDL,
        favoriteAddress,
        provider
      ) as Program<Favorites>;
      console.log("Program instance created");

      const [favoriteAdd] = PublicKey.findProgramAddressSync(
        [Buffer.from("favorites"), userKeypair.publicKey.toBuffer()],
        favoriteAddress,
      );
      console.log("Derived PDA:", favoriteAdd.toBase58());

      console.log("Attempting to call setFavorites...");
      const tx = await favoriteProgram.methods
        .setFavorites(
          new anchor.BN(7),
          "Blue",
          ["Solana", "Rust", "Anchor"])
        .accounts({
          user: userKeypair.publicKey,
          favorites: favoriteAdd,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Transaction signature:", tx);

      const account = await favoriteProgram.account.favorites.fetch(favoriteAdd);
      console.log("Fetched account:", account);

    } catch (error) {
      console.error("Detailed error:", error);
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      throw error;
    }
  });
});