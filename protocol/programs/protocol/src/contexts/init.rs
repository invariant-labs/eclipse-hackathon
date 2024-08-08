use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitCtx<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
}

impl<'info> InitCtx<'info> {
    pub fn process(&mut self) -> Result<()> {
        Ok(())
    }
}
