#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

pub const ANCHOR_DISCRIMINATOR: usize = 8;

declare_id!("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ");

#[program]
pub mod voting {
    use super::*;

    pub fn initialize_poll(
        ctx: Context<InitializePoll>,
        poll_id: u64,
        poll_description: String,
        poll_start_time: u64,
        poll_end_time: u64,
    ) -> Result<()> {
        let poll = &mut ctx.accounts.poll;
        poll.poll_id = poll_id;
        poll.poll_description = poll_description;
        poll.poll_start_time = poll_start_time;
        poll.poll_end_time = poll_end_time;
        poll.candidate_amount = 0;
        Ok(())
    }

    pub fn initialize_candidate(ctx: Context<InitializeCandidate>, candidate_name: String, poll_id: u64) -> Result<()> {
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_name = candidate_name;
        candidate.poll_id = poll_id;
        candidate.candidate_votes = 0;
        let poll = &mut ctx.accounts.poll;
        
        poll.candidate_amount += 1;

        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, _candidate_name: String, _poll_id: u64) -> Result<()> {
        
        let candidate = &mut ctx.accounts.candidate;
        candidate.candidate_votes += 1;



        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)]
pub struct Vote<'info> {
    pub signer: Signer<'info>,  

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump, // Calculated by the runtime.
    )]
    pub candidate: Account<'info, Candidate>,

    #[account(
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump, // Calculated by the runtime.
    )]
    pub poll: Account<'info, Poll>,
}


#[account]
#[derive(InitSpace)]
pub struct Poll {
    pub poll_id: u64,
    #[max_len(280)]
    pub poll_description: String,
    pub poll_start_time: u64,
    pub poll_end_time: u64,
    pub candidate_amount: u64,
}

#[derive(Accounts)]
#[instruction(poll_id: u64)] // This is the instruction data, not the account data, so it's not in the `#[account]` attribute, but in the `#[instruction]` attribute.
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR + Poll::INIT_SPACE,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump, // Calculated by the runtime.

    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}


#[account]
#[derive(InitSpace)]
pub struct Candidate {
    #[max_len(50)]
    pub candidate_name: String,
    pub poll_id: u64,
    pub candidate_votes: u64,
}

#[derive(Accounts)]
#[instruction(candidate_name: String, poll_id: u64)] // This is the instruction data, not the account data, so it's not in the `#[account]` attribute, but in the `#[instruction]` attribute.
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        space = ANCHOR_DISCRIMINATOR + Candidate::INIT_SPACE,
        seeds = [ poll_id.to_le_bytes().as_ref(), candidate_name.as_bytes()],
        bump, // Calculated by the runtime.
    )]
    pub candidate: Account<'info, Candidate>,

    #[account(
        mut,
        seeds = [poll_id.to_le_bytes().as_ref()],
        bump, // Calculated by the runtime.
    )]
    pub poll: Account<'info, Poll>,
    pub system_program: Program<'info, System>,
}