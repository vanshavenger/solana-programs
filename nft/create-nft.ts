import {
  createNft,
  fetchAllDigitalAsset,
  fetchDigitalAsset,
  mplTokenMetadata,
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

console.log(`Set up UMI with user ${umiUser.publicKey}`);

const collectionAddress = publicKey("DbFEo9FxwTyfRZ9TDcnGceegp2P7sqsEsJXYfsSYKmGC")


console.log("Creating NFT")

const mint = generateSigner(umi);

const transaction = createNft(umi, {
    mint,
    name: "My NFT",
    uri: "https://www.dsandev.in/api/token",
    sellerFeeBasisPoints: percentAmount(0),
    collection: {
        key: collectionAddress,
        verified: false,
    },

})
await transaction.sendAndConfirm(umi);
const createdNft = await fetchDigitalAsset(umi, mint.publicKey);

console.log(`Created NFT: ${createdNft}`);

console.log(getExplorerLink("address", createdNft.mint.publicKey, "devnet"));
