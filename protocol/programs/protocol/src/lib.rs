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

    pub fn init(ctx: Context<InitCtx>) -> Result<()> {
        ctx.accounts.process()?;
        Ok(())
    }
}
