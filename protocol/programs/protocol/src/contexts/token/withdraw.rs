use crate::{get_signer, ErrorCode::*};
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::states::{DerivedAccountIdentifier, State};

#[derive(Accounts)]
pub struct WithdrawCtx<'info> {
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
        constraint = reserve.mint == token_mint.key() @ InvalidMint,
        constraint = reserve.owner == program_authority.key() @ InvalidAuthority
    )]
    pub reserve: Account<'info, TokenAccount>,

    #[account(mut,
        constraint = user_balance.mint == token_mint.key() @ InvalidMint,
        constraint = user_balance.owner == owner.key() @ InvalidOwner
    )]
    pub user_balance: Account<'info, TokenAccount>,

    pub owner: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

impl<'info> WithdrawCtx<'info> {
    pub fn withdraw_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.reserve.to_account_info(),
                to: self.user_balance.to_account_info(),
                authority: self.program_authority.clone(),
            },
        )
    }
}

impl WithdrawCtx<'_> {
    pub fn process(&self, amount: u64) -> Result<()> {
        let state = &self.state.load()?;
        let signer: &[&[&[u8]]] = get_signer!(state.bump_authority);

        token::transfer(self.withdraw_ctx().with_signer(signer), amount)
    }
}
