#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

pub const ANCHOR_DISCRIMINATOR: usize = 8;
declare_id!("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ");

#[program]
pub mod tokenvesting {
    use super::*;

    pub fn create_vesting_account(context: Context<CreateVestingAccount>, company_name: String) -> Result<()> {
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
