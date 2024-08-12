mod contexts;
mod errors;
pub mod states;

use anchor_lang::prelude::*;
pub use contexts::*;
pub use errors::ErrorCode;
pub use program_id::*;

mod program_id {
    use anchor_lang::prelude::*;
    declare_id!("HTBzkQCWc2sbkn5WmLkPmQKKotaeeWgZ3RSD4Eg3f1MS");
}

const PROTOCOL_AUTHORITY_SEED: &str = "PROTOCOLAuthority";

#[macro_export]
macro_rules! get_signer {
    ($authority_bump: expr) => {
        &[&[PROTOCOL_AUTHORITY_SEED.as_bytes(), &[$authority_bump]]]
    };
}

#[program]
pub mod protocol {

    use anchor_spl::token::{self};

    use super::*;

    pub fn init(ctx: Context<InitCtx>, bump_authority: u8) -> Result<()> {
        let bump = ctx.bumps.state;
        ctx.accounts.process(bump, bump_authority)?;
        Ok(())
    }

    pub fn test(ctx: Context<Test>, state_bump: u8) -> Result<()> {
        ctx.accounts.process(state_bump)?;
        Ok(())
    }

    pub fn mint(ctx: Context<MintCtx>, amount: u64) -> Result<()> {
        let state = &ctx.accounts.state.load()?;

        let signer: &[&[&[u8]]] = get_signer!(state.bump_authority);

        // Mint the ??? token
        token::mint_to(ctx.accounts.mint_cctx().with_signer(signer), amount)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<DepositCtx>, amount: u64) -> Result<()> {
        // Deposit the ??? token
        token::transfer(ctx.accounts.deposit_cctx(), amount)?;
        Ok(())
    }
}
