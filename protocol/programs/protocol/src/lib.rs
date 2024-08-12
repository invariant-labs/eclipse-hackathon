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
    ($nonce: expr) => {
        &[&[PROTOCOL_AUTHORITY_SEED.as_bytes(), &[$nonce]]]
    };
}

#[program]
pub mod protocol {

    use anchor_spl::token::{self};

    use super::*;

    pub fn init(ctx: Context<InitCtx>, bump_authority: u8) -> ProgramResult {
        let bump = *ctx.bumps.get("state").unwrap();
        ctx.accounts.process(bump, bump_authority)?;
        Ok(())
    }

    pub fn test(ctx: Context<Test>, state_bump: u8) -> ProgramResult {
        ctx.accounts.process(state_bump)?;
        Ok(())
    }

    pub fn mint(ctx: Context<MintCtx>, amount: u64) -> ProgramResult {
        let state = &mut ctx.accounts.state.load_mut()?;

        let signer: &[&[&[u8]]] = get_signer!(state.bump_authority);

        // Mint the ??? token
        token::mint_to(ctx.accounts.mint_ctx().with_signer(signer), amount)?;
        Ok(())
    }
}
