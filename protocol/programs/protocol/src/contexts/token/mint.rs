use crate::{get_signer, ErrorCode::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, MintTo, Token, TokenAccount};

use crate::states::{DerivedAccountIdentifier, State};

#[derive(Accounts)]
pub struct MintCtx<'info> {
    #[account(
        seeds = [State::IDENT],
        bump = state.load()?.bump
    )]
    pub state: AccountLoader<'info, State>,

    /// CHECK: pretty much only cached from the state account
    #[account(constraint = &state.load()?.program_authority == program_authority.key @ InvalidAuthority)]
    pub program_authority: AccountInfo<'info>,
    #[account(mut)]
    pub token_mint: Account<'info, anchor_spl::token::Mint>,
    #[account(mut,
        constraint = to.mint == token_mint.key()
    )]
    pub to: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

impl<'info> MintCtx<'info> {
    pub fn mint_ctx(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            MintTo {
                mint: self.token_mint.to_account_info(),
                to: self.to.to_account_info(),
                authority: self.program_authority.to_account_info(),
            },
        )
    }
}

impl MintCtx<'_> {
    pub fn process(&self, amount: u64) -> Result<()> {
        let state = &self.state.load()?;

        let signer: &[&[&[u8]]] = get_signer!(state.bump_authority);
        token::mint_to(self.mint_ctx().with_signer(signer), amount)
    }
}
