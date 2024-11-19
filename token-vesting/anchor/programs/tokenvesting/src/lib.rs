#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

pub const ANCHOR_DISCRIMINATOR: usize = 8;
declare_id!("J1RkQLCjdpaRww8CD5TXu9nmkp2cd4odZ7AkH3j17Bko");

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

    pub fn claim_tokens(context: Context<ClaimTokens>, _company_name: String) -> Result<()> {
        let employee_account = &mut context.accounts.employee_account;
        let now = Clock::get()?.unix_timestamp;
        if now < employee_account.cliff_time {
            return Err(ErrorCode::ClaimNotAvailableYet.into());
        }

        let time_since_start = now.saturating_sub(employee_account.start_time);
        let total_vesting_time = employee_account
            .end_time
            .saturating_sub(employee_account.start_time);

        if total_vesting_time <= 0 {
            return Err(ErrorCode::InvalidVestingPeriod.into());
        }

        let vested_amount = if now >= employee_account.end_time {
            employee_account.total_amount
        } else {
            match employee_account
                .total_amount
                .checked_mul(time_since_start as u64)
            {
                Some(product) => product / total_vesting_time as u64,
                None => return Err(ErrorCode::CalculationOverflow.into()),
            }
        };

        let claimable_amount = vested_amount.saturating_sub(employee_account.total_withdrawn);

        if claimable_amount <= 0 {
            return Err(ErrorCode::NothingToClaim.into());
        }

        let transfer_cpi_accounts = TransferChecked {
            authority: context.accounts.treasury_token_account.to_account_info(),
            from: context.accounts.treasury_token_account.to_account_info(),
            to: context.accounts.employee_token_account.to_account_info(),
            mint: context.accounts.mint.to_account_info(),
        };

        let seeds = &[
            b"vesting_treasury",
            context.accounts.vesting_account.company_name.as_bytes(),
            &[context.accounts.vesting_account.treasury_bump],
        ];

        let signer_seeds = &[&seeds[..]];

        let cpi_ctx = CpiContext::new_with_signer(
            context.accounts.token_program.to_account_info(),
            transfer_cpi_accounts,
            signer_seeds,
        );

        employee_account.total_withdrawn = employee_account
            .total_withdrawn
            .saturating_add(claimable_amount);

        transfer_checked(cpi_ctx, claimable_amount, context.accounts.mint.decimals)
    }
}

#[derive(Accounts)]
#[instruction(company_name: String)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub beneficiary: Signer<'info>,

    #[account(
        mut,
        seeds = [b"employee_vesting", beneficiary.key().as_ref(),vesting_account.key().as_ref()],
        bump = employee_account.bump,
        has_one = beneficiary,
        has_one = vesting_account,
    )]
    pub employee_account: Account<'info, EmployeeAccount>,

    #[account(
        mut,
        seeds = [company_name.as_ref()],
        bump = vesting_account.bump,
        has_one = treasury_token_account,
        has_one = mint,
    )]
    pub vesting_account: Account<'info, VestingAccount>,

    #[account(mut)]
    pub treasury_token_account: InterfaceAccount<'info, TokenAccount>,

    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = beneficiary,
        associated_token::mint = mint,
        associated_token::authority = beneficiary,
        associated_token::token_program = token_program,
    )]
    pub employee_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
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

#[error_code]
pub enum ErrorCode {
    #[msg("Claim not available yet")]
    ClaimNotAvailableYet,

    #[msg("Invalid vesting period")]
    InvalidVestingPeriod,

    #[msg("Calculation overflow")]
    CalculationOverflow,

    #[msg("Nothing to claim")]
    NothingToClaim,
}
