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

#[program]
pub mod protocol {

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
}
