use crate::states::{DerivedAccountIdentifier, State};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction( bump_authority: u8)]
pub struct InitCtx<'info> {
    #[account(init, space = State::LEN, seeds = [State::IDENT], bump, payer = admin)]
    pub state: AccountLoader<'info, State>,

    /// CHECK:
    #[account(seeds = [b"PROTOCOLAuthority".as_ref()], bump = bump_authority)]
    pub program_authority: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

impl InitCtx<'_> {
    pub fn process(&mut self, bump: u8, bump_authority: u8) -> Result<()> {
        let state = &mut self.state.load_init()?;
        **state = State {
            admin: *self.admin.key,
            program_authority: *self.program_authority.key,
            counter: 0,
            bump_authority,
            bump,
        };
        Ok(())
    }
}
