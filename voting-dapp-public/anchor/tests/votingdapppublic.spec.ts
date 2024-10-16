import * as anchor from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import { Voting } from '../target/types/voting'
import { startAnchor } from "solana-bankrun";
import { BankrunProvider } from "anchor-bankrun";

import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, BN, Program, setProvider, workspace } from "@coral-xyz/anchor";
const IDL = require("../target/idl/voting.json");

const votingAddress = new PublicKey(
  "2JxqishUPxmwTWAk7rJGMEq4KQy8fMD7aKzdp4wqRTmn",
);

describe("voting-dapp", () => {
  let context;
  let provider;
  setProvider(AnchorProvider.env());
  let votingProgram = workspace.Voting as Program<Voting>;
  // let votingProgram: Program<Voting>;

  beforeAll(async () => {
    // context = await startAnchor("", [{name: "voting", programId: votingAddress}], []);
    // provider = new BankrunProvider(context);

    // votingProgram = new Program<Voting>(
    //   IDL,
    //   provider
    // ) as Program<Voting>;
  })

  it("Initialize Poll", async () => {
    await votingProgram.methods.initializePoll(
      new BN(1),
      "what is your fav type of fruit?",
      new BN(0),
      new BN(1823549207),
    ).rpc()

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer, "le", 8)],
      votingAddress,
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress)

    console.log(poll)

    expect(poll.pollDescription).toEqual("what is your fav type of fruit?");

    expect(poll.pollId.toNumber()).toEqual(1);

    expect(poll.candidateAmount.toNumber()).toEqual(0);

    expect(poll.pollEndTime.toNumber()).toBeGreaterThanOrEqual(poll.pollStartTime.toNumber());

  });

  it("Initialize Candidate", async () => { 

    await votingProgram.methods.initializeCandidate(
      "Smooth",
      new BN(1),
    ).rpc()

    await votingProgram.methods.initializeCandidate(
      "Crunchy",
      new BN(1),
    ).rpc()

    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer,'le', 8), Buffer.from("Crunchy")],
      votingAddress,
    )

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer,'le', 8), Buffer.from("Smooth")],
      votingAddress,
    )
    const crunchy = await votingProgram.account.candidate.fetch(crunchyAddress)
    console.log(crunchy)
    const smooth = await votingProgram.account.candidate.fetch(smoothAddress)
    
    console.log(smooth)

    expect(crunchy.candidateName).toEqual("Crunchy");
    expect(crunchy.pollId.toNumber()).toEqual(1);

    expect(smooth.candidateName).toEqual("Smooth");

    expect(smooth.pollId.toNumber()).toEqual(1);

    expect(crunchy.candidateVotes.toNumber()).toEqual(0);

    expect(smooth.candidateVotes.toNumber()).toEqual(0);

  });
  
  it("Vote", async () => {

    await votingProgram.methods.vote(
      "Crunchy",
      new BN(1),
    )
      .rpc()
    
    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new BN(1).toArrayLike(Buffer,'le', 8), Buffer.from("Crunchy")],
      votingAddress,
    )

    const crunchy = await votingProgram.account.candidate.fetch(crunchyAddress)

    console.log(crunchy)

    expect(crunchy.candidateVotes.toNumber()).toEqual(1);

    


  });
});
