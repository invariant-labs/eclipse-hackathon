use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use invariant::{
    cpi::accounts::{CreatePosition, RemovePosition},
    program::Invariant,
    structs::{Pool, Position, PositionList, State as InvariantState, Tick, Tickmap},
};

#[derive(Accounts)]
pub struct ReopenPositionCtx<'info> {
    pub invariant_program: Program<'info, Invariant>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub invariant_state: AccountLoader<'info, InvariantState>,
    /// CHECK: invariant_program_authority is the authority of the Invariant program
    pub invariant_program_authority: AccountInfo<'info>,
    #[account(mut)]
    pub position: AccountLoader<'info, Position>,
    #[account(mut)]
    pub last_position: AccountLoader<'info, Position>,
    #[account(mut)]
    pub pool: AccountLoader<'info, Pool>,
    #[account(mut)]
    pub position_list: AccountLoader<'info, PositionList>,
    #[account(mut)]
    pub lower_tick: AccountLoader<'info, Tick>,
    #[account(mut)]
    pub upper_tick: AccountLoader<'info, Tick>,
    #[account(mut)]
    pub tickmap: AccountLoader<'info, Tickmap>,
    pub token_x: InterfaceAccount<'info, Mint>,
    pub token_y: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub account_x: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub account_y: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub reserve_x: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub reserve_y: InterfaceAccount<'info, TokenAccount>,
    pub token_x_program: Interface<'info, TokenInterface>,
    pub token_y_program: Interface<'info, TokenInterface>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

impl ReopenPositionCtx<'_> {
    pub fn process(&mut self, index: u32) -> Result<()> {
        let ReopenPositionCtx {
            invariant_program,
            invariant_state,
            position,
            last_position,
            pool,
            position_list,
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
            invariant_program_authority,
            token_x_program,
            token_y_program,
            rent,
            system_program,
            ..
        } = self;
        let program = invariant_program.to_account_info();

        let Position {
            lower_tick_index,
            upper_tick_index,
            liquidity,
            ..
        } = *position.load()?;
        let Pool { sqrt_price, .. } = *pool.load()?;
        {
            let accounts = RemovePosition {
                state: invariant_state.to_account_info(),
                program_authority: invariant_program_authority.to_account_info(),
                owner: owner.to_account_info(),
                removed_position: position.to_account_info(),
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
            let ctx = CpiContext::new(program.clone(), accounts);
            invariant::cpi::remove_position(ctx, index, lower_tick_index, upper_tick_index)?;
        }
        {
            let accounts = CreatePosition {
                state: invariant_state.to_account_info(),
                // the previous last position was moved to the previous' address
                position: last_position.to_account_info(),
                pool: pool.to_account_info(),
                position_list: position_list.to_account_info(),
                payer: owner.to_account_info(),
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
                program_authority: invariant_program_authority.to_account_info(),
                token_x_program: token_x_program.to_account_info(),
                token_y_program: token_y_program.to_account_info(),
                rent: rent.to_account_info(),
                system_program: system_program.to_account_info(),
            };
            let ctx = CpiContext::new(program, accounts);

            invariant::cpi::create_position(
                ctx,
                lower_tick_index,
                upper_tick_index,
                liquidity,
                sqrt_price,
                sqrt_price,
            )
        }
    }
}
