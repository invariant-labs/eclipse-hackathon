use anchor_lang::prelude::*;
use invariant::{cpi::accounts::CreatePosition, decimals::*, program::Invariant};

#[derive(Accounts)]
#[instruction(
    _lower_tick_index: i32,
    _upper_tick_index: i32,
    liquidity_delta: Liquidity,
    slippage_limit_lower: Price,
    slippage_limit_upper: Price
)]
pub struct InvokeCreatePositionCtx<'info> {
    pub invariant_program: Program<'info, Invariant>,
    #[account(mut)]
    pub signer: Signer<'info>,
    /// CHECK:
    pub state: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub position: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub pool: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub position_list: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub payer: UncheckedAccount<'info>,
    /// CHECK:
    pub owner: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub lower_tick: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub upper_tick: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub tickmap: UncheckedAccount<'info>,
    /// CHECK:
    pub token_x: UncheckedAccount<'info>,
    /// CHECK:
    pub token_y: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub account_x: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub account_y: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub reserve_x: UncheckedAccount<'info>,
    /// CHECK:
    #[account(mut)]
    pub reserve_y: UncheckedAccount<'info>,
    /// CHECK:
    pub program_authority: UncheckedAccount<'info>,
    /// CHECK:
    pub token_x_program: UncheckedAccount<'info>,
    /// CHECK:
    pub token_y_program: UncheckedAccount<'info>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

impl<'info> InvokeCreatePositionCtx<'info> {
    pub fn process(
        &mut self,
        _lower_tick_index: i32,
        _upper_tick_index: i32,
        liquidity_delta: u128,
        slippage_limit_lower: u128,
        slippage_limit_upper: u128,
    ) -> Result<()> {
        let InvokeCreatePositionCtx {
            invariant_program,
            state,
            position,
            pool,
            position_list,
            payer,
            owner,
            lower_tick,
            upper_tick,
            tickmap,
            token_x,
            token_y,
            account_x,
            account_y,
            reserve_x,
            reserve_y,
            program_authority,
            token_x_program,
            token_y_program,
            rent,
            system_program,
            ..
        } = self;

        let program = invariant_program.to_account_info();
        let accounts = CreatePosition {
            state: state.to_account_info(),
            position: position.to_account_info(),
            pool: pool.to_account_info(),
            position_list: position_list.to_account_info(),
            payer: payer.to_account_info(),
            owner: owner.to_account_info(),
            lower_tick: lower_tick.to_account_info(),
            upper_tick: upper_tick.to_account_info(),
            tickmap: tickmap.to_account_info(),
            token_x: token_x.to_account_info(),
            token_y: token_y.to_account_info(),
            account_x: account_x.to_account_info(),
            account_y: account_y.to_account_info(),
            reserve_x: reserve_x.to_account_info(),
            reserve_y: reserve_y.to_account_info(),
            program_authority: program_authority.to_account_info(),
            token_x_program: token_x_program.to_account_info(),
            token_y_program: token_y_program.to_account_info(),
            rent: rent.to_account_info(),
            system_program: system_program.to_account_info(),
        };
        let ctx = CpiContext::new(program, accounts);

        invariant::cpi::create_position(
            ctx,
            _lower_tick_index,
            _upper_tick_index,
            invariant::decimals::Liquidity { v: liquidity_delta },
            invariant::decimals::Price {
                v: slippage_limit_lower,
            },
            invariant::decimals::Price {
                v: slippage_limit_upper,
            },
        )?;

        Ok(())
    }
}
