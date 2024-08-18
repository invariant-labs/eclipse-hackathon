use crate::states::{DerivedAccountIdentifier, LpPool};
use crate::ErrorCode::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use anchor_spl::{token, token_2022};
use decimal::Decimal;
use invariant::structs::Pool;

use crate::states::State;

#[derive(Accounts)]
pub struct InitPoolCtx<'info> {
    #[account(
        seeds = [State::IDENT],
        bump = state.load()?.bump
    )]
    pub state: AccountLoader<'info, State>,
    /// CHECK: cached from the state account
    #[account(constraint = &state.load()?.program_authority == program_authority.key @ InvalidAuthority)]
    pub program_authority: AccountInfo<'info>,

    #[account(init, space = LpPool::LEN,
        seeds = [LpPool::IDENT, token_x.key().as_ref(), token_y.key().as_ref(), &pool.load()?.fee.v.to_le_bytes(), &pool.load()?.tick_spacing.to_le_bytes()],
        bump, payer = signer
    )]
    pub lp_pool: AccountLoader<'info, LpPool>,
    #[account(init,
        payer = signer,
        mint::decimals = 6,
        mint::authority = program_authority,
        mint::token_program = associated_token_program)]
    pub token_lp: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut,
        seeds = [b"poolv1", token_x.key().as_ref(), token_y.key().as_ref(), &pool.load()?.fee.v.to_le_bytes(), &pool.load()?.tick_spacing.to_le_bytes()],
        bump = pool.load()?.bump
    )]
    pub pool: AccountLoader<'info, Pool>,
    pub token_x: InterfaceAccount<'info, Mint>,
    pub token_y: InterfaceAccount<'info, Mint>,
    #[account(init_if_needed,
        associated_token::mint = token_x,
        associated_token::authority = program_authority,
        associated_token::token_program = token_x_program,
        payer = signer,
    )]
    pub reserve_x: InterfaceAccount<'info, TokenAccount>,
    #[account(init_if_needed,
        associated_token::mint = token_y,
        associated_token::authority = program_authority,
        associated_token::token_program = token_y_program,
        payer = signer,
    )]
    pub reserve_y: InterfaceAccount<'info, TokenAccount>,
    #[account(constraint = token_x_program.key() == token::ID || token_x_program.key() == token_2022::ID)]
    pub token_x_program: Interface<'info, TokenInterface>,
    #[account(constraint = token_y_program.key() == token::ID || token_y_program.key() == token_2022::ID)]
    pub token_y_program: Interface<'info, TokenInterface>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl InitPoolCtx<'_> {
    pub fn process(&mut self, bump: u8) -> Result<()> {
        let token_x = self.token_x.key();
        let token_y = self.token_y.key();
        let token_lp = self.token_lp.key();
        let reserve_x = self.reserve_x.key();
        let reserve_y = self.reserve_y.key();

        let lp_pool = &mut self.lp_pool.load_init()?;
        let pool = &self.pool.load()?;
        **lp_pool = LpPool {
            token_lp,
            // TODO: Make a "position list" account, every single one of our pools is one position
            position_index: 0,
            reserve_x,
            reserve_y,
            leftover_x: 0,
            leftover_y: 0,
            token_x,
            token_y,
            tick_spacing: pool.tick_spacing,
            fee: crate::decimals::FixedPoint::new(pool.fee.v),
            bump,
        };

        Result::<()>::Ok(())
    }
}
