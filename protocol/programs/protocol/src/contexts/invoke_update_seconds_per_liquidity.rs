use anchor_lang::prelude::*;
use invariant::{cpi::accounts::UpdateSecondsPerLiquidity, program::Invariant};

#[derive(Accounts)]
pub struct InvokeUpdateSecondsPerLiquidityCtx<'info> {
    pub invariant_program: Program<'info, Invariant>,
    /// CHECK:
    #[account(mut)]
    pub pool: UncheckedAccount<'info>,
    /// CHECK:
    pub lower_tick: UncheckedAccount<'info>,
    /// CHECK:
    pub upper_tick: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub position: UncheckedAccount<'info>,
    /// CHECK:
    pub token_x: UncheckedAccount<'info>,
    /// CHECK:
    pub token_y: UncheckedAccount<'info>,
    /// CHECK:
    pub owner: UncheckedAccount<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

impl<'info> InvokeUpdateSecondsPerLiquidityCtx<'info> {
    pub fn process(
        &mut self,
        lower_tick_index: i32,
        upper_tick_index: i32,
        index: i32,
    ) -> Result<()> {
        let InvokeUpdateSecondsPerLiquidityCtx {
            invariant_program,
            pool,
            lower_tick,
            upper_tick,
            position,
            token_x,
            token_y,
            owner,
            signer,
            rent,
            system_program,
        } = self;

        let program = invariant_program.to_account_info();
        let accounts = UpdateSecondsPerLiquidity {
            pool: pool.to_account_info(),
            lower_tick: lower_tick.to_account_info(),
            upper_tick: upper_tick.to_account_info(),
            position: position.to_account_info(),
            token_x: token_x.to_account_info(),
            token_y: token_y.to_account_info(),
            owner: owner.to_account_info(),
            signer: signer.to_account_info(),
            rent: rent.to_account_info(),
            system_program: system_program.to_account_info(),
        };
        let ctx = CpiContext::new(program, accounts);

        invariant::cpi::update_seconds_per_liquidity(
            ctx,
            lower_tick_index,
            upper_tick_index,
            index,
        )?;

        Ok(())
    }
}
