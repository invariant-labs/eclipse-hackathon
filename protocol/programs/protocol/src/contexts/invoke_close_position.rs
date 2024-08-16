use anchor_lang::prelude::*;
use anchor_spl::token::Token;
use invariant::{cpi::accounts::RemovePosition, program::Invariant};

#[derive(Accounts)]
pub struct InvokeClosePositionCtx<'info> {
    #[account(mut)]
    /// CHECK: checked in Invariant
    pub invariant_state: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    pub invariant_program_authority: UncheckedAccount<'info>,
    #[account(mut)]
    pub owner: Signer<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub removed_position: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub position_list: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub last_position: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub pool: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub tickmap: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub lower_tick: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub upper_tick: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    pub token_x: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    pub token_y: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub account_x: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub account_y: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub reserve_x: UncheckedAccount<'info>,
    /// CHECK: checked in Invariant
    #[account(mut)]
    pub reserve_y: UncheckedAccount<'info>,
    pub token_x_program: Program<'info, Token>,
    pub token_y_program: Program<'info, Token>,
    pub invariant_program: Program<'info, Invariant>,
}

impl InvokeClosePositionCtx<'_> {
    pub fn process(&self, index: u32, lower_tick_index: i32, upper_tick_index: i32) -> Result<()> {
        let InvokeClosePositionCtx {
            invariant_state,
            invariant_program_authority,
            owner,
            removed_position,
            position_list,
            last_position,
            pool,
            tickmap,
            lower_tick,
            upper_tick,
            token_x,
            token_y,
            account_x,
            account_y,
            reserve_x,
            reserve_y,
            token_x_program,
            token_y_program,
            invariant_program,
        } = self;

        let program = invariant_program.to_account_info();
        let accounts = RemovePosition {
            state: invariant_state.to_account_info(),
            program_authority: invariant_program_authority.to_account_info(),
            owner: owner.to_account_info(),
            removed_position: removed_position.to_account_info(),
            position_list: position_list.to_account_info(),
            last_position: last_position.to_account_info(),
            pool: pool.to_account_info(),
            tickmap: tickmap.to_account_info(),
            lower_tick: lower_tick.to_account_info(),
            upper_tick: upper_tick.to_account_info(),
            token_x: token_x.to_account_info(),
            token_y: token_y.to_account_info(),
            account_x: account_x.to_account_info(),
            account_y: account_y.to_account_info(),
            reserve_x: reserve_x.to_account_info(),
            reserve_y: reserve_y.to_account_info(),
            token_x_program: token_x_program.to_account_info(),
            token_y_program: token_y_program.to_account_info(),
        };
        let ctx = CpiContext::new(program, accounts);
        invariant::cpi::remove_position(ctx, index, lower_tick_index, upper_tick_index)
    }
}
