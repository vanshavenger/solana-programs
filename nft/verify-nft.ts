import {
  createNft,
  fetchAllDigitalAsset,
  fetchDigitalAsset,
  findMetadataPda,
  mplTokenMetadata,
  verifyCollection,
  verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { clusterApiUrl, Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const user = await getKeypairFromFile();

await airdropIfRequired(
  connection,
  user.publicKey,
  1 * LAMPORTS_PER_SOL,
  0.5 * LAMPORTS_PER_SOL,
);

console.log(`User public key: ${user.publicKey.toBase58()}`);

const umi = createUmi(connection.rpcEndpoint);

umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));

const collectionAddress = publicKey("DbFEo9FxwTyfRZ9TDcnGceegp2P7sqsEsJXYfsSYKmGC")
const nftAddress = publicKey("4zXhgxeR5qaeSr9J5UEADpqbYc6ECu2A9dV7gHrP9UPu")

const transaction = verifyCollectionV1(umi, { 
    metadata: findMetadataPda(umi, {
        mint: nftAddress,
    }),
    collectionMint: collectionAddress,
    authority: umi.identity
})

transaction.sendAndConfirm(umi)

console.log("NFT verified")

console.log(`See explorer at ${getExplorerLink("address",nftAddress,"devnet")}`)