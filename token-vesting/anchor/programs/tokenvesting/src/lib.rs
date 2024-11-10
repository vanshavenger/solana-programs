#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

pub const ANCHOR_DISCRIMINATOR: usize = 8;
declare_id!("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ");

#[program]
pub mod tokenvesting {
    use super::*;

    pub fn create_vesting_account(
        context: Context<CreateVestingAccount>,
        company_name: String,
    ) -> Result<()> {
        *context.accounts.vesting_account = VestingAccount {
            owner: context.accounts.signer.key(),
            mint: context.accounts.mint.key(),
            treasury_token_account: context.accounts.treasury_token_account.key(),
            company_name,
            treasury_bump: context.bumps.treasury_token_account,
            bump: context.bumps.vesting_account,
        };
        Ok(())
    }

    pub fn create_employee_account(
        context: Context<CreateEmployeeAccount>,
        start_time: i64,
        end_time: i64,
        cliff_time: i64,
        total_amount: u64,
    ) -> Result<()> {
        *context.accounts.employee_account = EmployeeAccount {
            beneficiary: context.accounts.beneficiary.key(),
            start_time,
            end_time,
            cliff_time,
            vesting_account: context.accounts.vesting_account.key(),
            total_amount,
            total_withdrawn: 0,
            bump: context.bumps.employee_account,
        };
        Ok(())
    }

    pub fn claim_tokens(
        context: Context<ClaimTokens>,
    ) ->Result<()> {
        Ok(())
    }
}



#[derive(Accounts)]
#[instruction(company_name: String)]
pub struct CreateVestingAccount<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
    init,
    payer = signer,
    space = ANCHOR_DISCRIMINATOR + VestingAccount::INIT_SPACE,
    seeds = [company_name.as_ref()],
    bump
  )]
    pub vesting_account: Account<'info, VestingAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
      init,
      payer = signer,
      token::mint = mint,
      token::authority = treasury_token_account,
      seeds = [b"vesting_treasury", company_name.as_bytes()],
      bump
    )]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

#[account]
#[derive(InitSpace)]
pub struct VestingAccount {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub treasury_token_account: Pubkey,
    #[max_len(50)]
    pub company_name: String,
    pub treasury_bump: u8,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct CreateEmployeeAccount<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    pub beneficiary: SystemAccount<'info>,
    #[account(
    has_one = owner,
  )]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(
    init,
    payer = owner,
    space = ANCHOR_DISCRIMINATOR + EmployeeAccount::INIT_SPACE,
    seeds = [b"employee_vesting", beneficiary.key().as_ref(),vesting_account.key().as_ref()],
    bump
  )]
    pub employee_account: Account<'info, EmployeeAccount>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct EmployeeAccount {
    pub beneficiary: Pubkey,
    pub start_time: i64,
    pub end_time: i64,
    pub cliff_time: i64,
    pub vesting_account: Pubkey,
    pub total_amount: u64,
    pub total_withdrawn: u64,
    pub bump: u8,
}


