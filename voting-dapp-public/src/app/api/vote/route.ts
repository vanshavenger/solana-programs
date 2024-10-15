import { BN, Program } from "@coral-xyz/anchor";
import {
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Voting } from "anchor/target/types/voting";

const IDL = require("@/../anchor/target/idl/voting.json");
export const OPTIONS = GET;

export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    type: "action",
    icon: "https://media.istockphoto.com/id/493916760/photo/peanut-butter.jpg?s=612x612&w=0&k=20&c=9ch29q5A5ZRIP6huAOeurX-g2dvhd_DknXLS7FRSerM=",
    title: "Vote for your favorite type of peanut butter",
    description:
      "Vote for your favorite type of peanut butter - Crunchy or Smooth",
    label: "Vote",
    links: {
      actions: [
        {
          label: "Vote for Crunchy",
          href: "/api/vote?candidate=Crunchy",
          type: "post",
        },
        {
          href: "/api/vote?candidate=Smooth",
          label: "Vote for Smooth",
          type: "post",
        },
      ],
    },
  };

  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");
  if (candidate === "Crunchy" || candidate === "Smooth") {
    const connection = new Connection("http://127.0.0.1:8899", "confirmed");
    const program: Program<Voting> = new Program(IDL, { connection });
    const body: ActionPostRequest = await request.json();
    let voter;

    try {
      voter = new PublicKey(body.account);
    } catch (error) {
      return new Response("Invalid Account", {
        status: 400,
        headers: ACTIONS_CORS_HEADERS,
      });
    }

    const instruction = await program.methods
      .vote(candidate, new BN(1))
      .accounts({
        signer: voter,
      })
      .instruction();

    const blockhash = await connection.getLatestBlockhash();
    const transaction = new Transaction({
      feePayer: voter,
      blockhash: blockhash.blockhash,
      lastValidBlockHeight: blockhash.lastValidBlockHeight,
    }).add(instruction);

    const response = await createPostResponse({
      fields: {
        transaction: transaction,
        type: "transaction",
      },
    });

    console.log(response);
    return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
  }

  return new Response("Invalid candidate", {
    status: 400,
    headers: ACTIONS_CORS_HEADERS,
  });
}
