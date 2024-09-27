use crate::states::{DerivedAccountIdentifier, LpPool, INVARIANT_POOL_IDENT, LP_TOKEN_IDENT};
use crate::ErrorCode::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::Token2022;
use anchor_spl::token_interface::Mint;
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

    #[account(init,
        seeds = [LpPool::IDENT, token_x.key().as_ref(), token_y.key().as_ref(), &pool.load()?.fee.v.to_le_bytes(), &pool.load()?.tick_spacing.to_le_bytes()],
        space = LpPool::LEN,
        bump,
        payer = payer
    )]
    pub lp_pool: AccountLoader<'info, LpPool>,
    #[account(init,
        seeds = [LP_TOKEN_IDENT, token_x.key().as_ref(), token_y.key().as_ref(), &pool.load()?.fee.v.to_le_bytes(), &pool.load()?.tick_spacing.to_le_bytes()],
        bump,
        payer = payer,
        mint::decimals = 6,
        mint::authority = program_authority,
        mint::token_program = token_program)]
    pub token_lp: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        seeds = [INVARIANT_POOL_IDENT, token_x.key().as_ref(), token_y.key().as_ref(), &pool.load()?.fee.v.to_le_bytes(), &pool.load()?.tick_spacing.to_le_bytes()],
        bump = pool.load()?.bump,
        seeds::program = invariant::ID
    )]
    pub pool: AccountLoader<'info, Pool>,
    pub token_x: InterfaceAccount<'info, Mint>,
    pub token_y: InterfaceAccount<'info, Mint>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl InitPoolCtx<'_> {
    pub fn process(&mut self, token_bump: u8, bump: u8) -> Result<()> {
        let token_x = self.token_x.key();
        let token_y = self.token_y.key();
        let lp_pool = &mut self.lp_pool.load_init()?;
        let pool = &self.pool.load()?;

        **lp_pool = LpPool {
            position_index: u32::MAX,
            position_exists: false,
            leftover_x: 0,
            leftover_y: 0,
            token_x,
            token_y,
            tick_spacing: pool.tick_spacing,
            fee: crate::decimals::FixedPoint::new(pool.fee.v),
            token_bump,
            bump,
        };

        Ok(())
    }
}
