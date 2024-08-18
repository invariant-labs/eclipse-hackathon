mod contexts;
pub mod decimals;
mod errors;
pub mod math;
pub mod states;
pub mod utils;

use anchor_lang::prelude::*;
pub use contexts::*;
pub use errors::ErrorCode;
pub use invariant::decimals::*;
pub use program_id::*;

mod program_id {
    use anchor_lang::prelude::*;
    declare_id!("HTBzkQCWc2sbkn5WmLkPmQKKotaeeWgZ3RSD4Eg3f1MS");
}

#[macro_export]
macro_rules! get_signer {
    ($authority_bump: expr) => {
        &[&[b"PROTOCOLAuthority", &[$authority_bump]]]
    };
}

#[program]
pub mod protocol {

    use super::*;

    pub fn init(ctx: Context<InitCtx>, bump_authority: u8) -> Result<()> {
        let bump = ctx.bumps.state;
        ctx.accounts.process(bump, bump_authority)
    }

    pub fn test(ctx: Context<Test>, state_bump: u8) -> Result<()> {
        ctx.accounts.process(state_bump)
    }

    pub fn mint(ctx: Context<MintCtx>, amount: u64) -> Result<()> {
        ctx.accounts.process(amount)
    }

    pub fn deposit(ctx: Context<DepositCtx>, amount: u64) -> Result<()> {
        ctx.accounts.process(amount)
    }

    pub fn withdraw(ctx: Context<WithdrawCtx>, amount: u64) -> Result<()> {
        ctx.accounts.process(amount)
    }

    pub fn invoke_update_seconds_per_liquidity(
        ctx: Context<InvokeUpdateSecondsPerLiquidityCtx>,
        lower_tick_index: i32,
        upper_tick_index: i32,
        index: i32,
    ) -> Result<()> {
        ctx.accounts
            .process(lower_tick_index, upper_tick_index, index)
    }

    pub fn invoke_create_position(
        ctx: Context<InvokeCreatePositionCtx>,
        lower_tick_index: i32,
        upper_tick_index: i32,
        liquidity_delta: u128,
        slippage_limit_lower: u128,
        slippage_limit_upper: u128,
    ) -> Result<()> {
        ctx.accounts.process(
            lower_tick_index,
            upper_tick_index,
            liquidity_delta,
            slippage_limit_lower,
            slippage_limit_upper,
        )
    }

    pub fn invoke_close_position(
        ctx: Context<InvokeClosePositionCtx>,
        index: u32,
        lower_tick_index: i32,
        upper_tick_index: i32,
    ) -> Result<()> {
        ctx.accounts
            .process(index, lower_tick_index, upper_tick_index)
    }

    pub fn reopen_position(ctx: Context<ReopenPositionCtx>, index: u32) -> Result<()> {
        ctx.accounts.process(index)
    }

    pub fn init_lp_pool(ctx: Context<InitPoolCtx>) -> Result<()> {
        let bump = ctx.bumps.lp_pool;
        ctx.accounts.process(bump)
    }
}
