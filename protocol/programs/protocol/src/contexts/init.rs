use crate::states::{DerivedAccountIdentifier, State};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

#[derive(Accounts)]
#[instruction( bump_authority: u8)]
pub struct InitCtx<'info> {
    #[account(init, seeds = [State::IDENT], bump, payer = admin)]
    pub state: AccountLoader<'info, State>,

    #[account(seeds = [b"PROTOCOLAuthority".as_ref()], bump = bump_authority)]
    pub program_authority: AccountInfo<'info>,

    #[account(mut)]
    pub admin: Signer<'info>,

    pub rent: Sysvar<'info, Rent>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

impl<'info> InitCtx<'info> {
    pub fn process(&mut self, bump: u8, bump_authority: u8) -> ProgramResult {
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
