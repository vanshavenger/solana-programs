use anchor_lang::prelude::*;

declare_id!("58J7yWgkR9nBNseNj6TaRa1SHV1DwXPum3JbWNta9c6Z");


pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8; // when we save things to blockchain we will need 8 bytes + size of the thing which we are saving.

#[program] // by adding this it become a Solana program or smart contract. set favourite is now instruction handler
pub mod favorites {
    use super::*;

    pub fn set_favorites(
        context: Context<SetFavorites>,
        number: u64,
        color: String,
        hobbies: Vec<String>,
    ) -> Result<()> {
        msg!("Greetings from {}", context.program_id);
        let user_public_key = &mut context.accounts.user.key();

        msg!(
            "User {}'s favorite number is {}, favorite color is {}, their hobbies are {:?}",
            user_public_key,
            number,
            color,
            hobbies
        );

        context.accounts.favorites.set_inner(Favorites {
            number,
            color,
            hobbies,
        });

        Ok(())
    }
}

#[account] // as we saving it to a account
#[derive(InitSpace)]
pub struct Favorites {
    pub number: u64,

    #[max_len(50)]
    pub color: String,

    #[max_len(5, 50)]
    pub hobbies: Vec<String>,
}

#[derive(Accounts)]
pub struct SetFavorites<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = ANCHOR_DISCRIMINATOR_SIZE + Favorites::INIT_SPACE,
        seeds = [b"favorites", user.key().as_ref()],
        bump
    )]
    pub favorites: Account<'info, Favorites>,

    pub system_program: Program<'info, System>,
}