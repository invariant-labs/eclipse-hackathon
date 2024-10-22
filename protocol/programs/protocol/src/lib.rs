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
    declare_id!("FE56ivh6V5JXW9nGuRV6DCWccXntLX8h4gtCqeJDwLZ8");
}

#[macro_export]
macro_rules! get_signer {
    ($authority_bump: expr) => {
        &[&[b"PROTOCOLAuthority", &[$authority_bump]]]
    };
}

#[program]
pub mod protocol {

    use decimals::Liquidity;

    use super::*;

    pub fn init(ctx: Context<InitCtx>, bump_authority: u8) -> Result<()> {
        let bump = ctx.bumps.state;
        ctx.accounts.process(bump, bump_authority)
    }

    pub fn init_lp_pool(ctx: Context<InitPoolCtx>) -> Result<()> {
        let token_bump = ctx.bumps.token_lp;
        let bump = ctx.bumps.lp_pool;
        ctx.accounts.process(token_bump, bump)
    }

    pub fn mint_lp_token(ctx: Context<MintLpTokenCtx>, liquidity: u128) -> Result<()> {
        ctx.accounts.process(Liquidity::new(liquidity))
    }

    pub fn burn_lp_token(ctx: Context<BurnLpTokenCtx>, liquidity: u128) -> Result<()> {
        ctx.accounts.process(Liquidity::new(liquidity))
    }
}
