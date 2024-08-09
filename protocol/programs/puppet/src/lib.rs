mod contexts;
mod errors;
pub mod states;

use anchor_lang::prelude::*;
pub use contexts::*;
pub use errors::ErrorCode;
pub use program_id::*;

mod program_id {
    use anchor_lang::prelude::*;
    declare_id!("8KQzCc22ZqGLPoipqRhYvkQtHJw6nY1NxrrGy8JLz1jC");
}

#[program]
pub mod puppet {

    use super::*;

    pub fn create_counter(ctx: Context<CreateCounter>, state_bump: u8) -> ProgramResult {
        ctx.accounts.process(state_bump)?;
        Ok(())
    }
}
