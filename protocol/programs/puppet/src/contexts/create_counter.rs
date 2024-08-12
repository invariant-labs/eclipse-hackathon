use crate::states::{Counter, DerivedAccountIdentifier};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CreateCounter<'info> {
    #[account(init, space = Counter::LEN + 8, seeds = [Counter::IDENT], bump, payer = admin)]
    pub counter: Account<'info, Counter>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateCounter<'info> {
    pub fn process(&mut self, state_bump: u8) -> Result<()> {
        let CreateCounter { counter, admin, .. } = self;

        **counter = Counter {
            owner: admin.key(),
            counter: 0,
            bump: state_bump,
        };

        Ok(())
    }
}
