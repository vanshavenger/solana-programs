import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js"
import * as anchor from "@coral-xyz/anchor";
import { BanksClient, Clock, ProgramTestContext, startAnchor } from "solana-bankrun";
import IDL from "../target/idl/tokenvesting.json"
import { program, SYSTEM_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/native/system";
import { BankrunProvider } from "anchor-bankrun";
import { Tokenvesting } from "../target/types/tokenvesting";

import {
  createMint,
  mintTo,
} from "spl-token-bankrun";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";



describe("vesting Smart Contract Tests", () => {
    const companyName = "Coral"
    let beneficiary: Keypair
    let context: ProgramTestContext
    let provider: BankrunProvider
    let program: anchor.Program<Tokenvesting>
    let banksClient: BanksClient
    let employer: Keypair
    let mint: PublicKey
    let program2: anchor.Program<Tokenvesting>
    let beneficiaryProvider: BankrunProvider
    let vestingAccountKey: PublicKey 
    let treasuryTokenAccount: PublicKey
    let employeeAccount: PublicKey
    beforeAll(async () => {
        beneficiary = new anchor.web3.Keypair()

        context = await startAnchor(
            "",
            [{
                name: "tokenvesting",
                programId: new PublicKey(IDL.address)
            }],
            [
                {
                    address: beneficiary.publicKey,
                    info: {
                        lamports: 1000000000000,
                        data: Buffer.alloc(0),
                        owner: SYSTEM_PROGRAM_ID,
                        executable: false
                    }
                }
            ]

        )
        provider = new BankrunProvider(context)
        anchor.setProvider(provider)

        program = new anchor.Program<Tokenvesting>(IDL as Tokenvesting, provider)

        banksClient = context.banksClient

        employer = provider.wallet.payer;
        // @ts-ignore
        mint = await createMint(banksClient, employer, employer.publicKey, null, 2);

        beneficiaryProvider = new BankrunProvider(context)

        beneficiaryProvider.wallet = new NodeWallet(beneficiary)

        program2 = new anchor.Program<Tokenvesting>(IDL as Tokenvesting, beneficiaryProvider);

        [vestingAccountKey] = PublicKey.findProgramAddressSync(
            [Buffer.from(companyName)],
            program.programId
        );

        [treasuryTokenAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("vesting_treasury"), Buffer.from(companyName)],
            program.programId
        );

        [employeeAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("employee_vesting"), beneficiary.publicKey.toBuffer(), vestingAccountKey.toBuffer()],
            program.programId
        );
    });

    it("should create a vesting account", async () => {
        const tx = await program.methods.createVestingAccount(companyName).accounts({
            signer: employer.publicKey,
            mint: mint,
            tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc({ commitment: "confirmed" })
        // console.log("Mint: ", mint)
        // console.log("Vesting Account Key: ", vestingAccountKey)
        // console.log("Treasury Token Account: ", treasuryTokenAccount)
        // console.log("Employee Account: ", employeeAccount)
        const vestingAccountData = await program.account.vestingAccount.fetch(vestingAccountKey)
        console.log("Vesting Account Data: ", vestingAccountData)
        console.log("Create vesting Ac counts: ", tx);
    });
    it("Should fund the treasury token account", async () => {
        const amount = 10 * LAMPORTS_PER_SOL;
        
        const mintTx = await mintTo(
            // @ts-ignore
            banksClient,
            employer,
            mint,
            treasuryTokenAccount,
            employer,
            amount,
        )
        console.log("Mint Tx: ", mintTx)
    })

    it("Should create employee vesting account", async () => {
        const tx2 = await program.methods.createEmployeeAccount(new anchor.BN(0), new anchor.BN(100), new anchor.BN(100), new anchor.BN(10) ).accounts({
            beneficiary: beneficiary.publicKey,
            vestingAccount: vestingAccountKey,
        }).rpc({ commitment: "confirmed" , skipPreflight: true})

        const employeeAccountData = await program.account.employeeAccount.fetch(employeeAccount)

        console.log("Employee Account Data: ", employeeAccount.toBase58())
        console.log("Create Employee Account: ", tx2)
    })

    it("Should claim tokens", async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        const currentClock = await banksClient.getClock();
        context.setClock(
            new Clock(
                currentClock.slot,
                currentClock.epochStartTimestamp,
                currentClock.epoch,
                currentClock.leaderScheduleEpoch,
                1000n
            )
        );

        const tx3 = await program2.methods.claimTokens(companyName).accounts({
            tokenProgram: TOKEN_PROGRAM_ID,
        }).rpc({ commitment: "confirmed" })

        console.log("Claim Tokens: ", tx3)

    })
})