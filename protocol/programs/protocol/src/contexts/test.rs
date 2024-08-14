use anchor_lang::prelude::*;
use puppet::{cpi::accounts::CreateCounter, program::Puppet};

#[derive(Accounts)]
pub struct Test<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub puppet_program: Program<'info, Puppet>,

    /// CHECK: This is the account that will be created by the Puppet program.
    #[account(mut)]
    pub counter: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

impl<'info> Test<'info> {
    pub fn process(&mut self, state_bump: u8) -> Result<()> {
        let Test {
            payer,
            puppet_program,
            counter,
            system_program,
        } = self;

        let program = puppet_program.to_account_info();
        let accounts = CreateCounter {
            counter: counter.to_account_info(),
            admin: payer.to_account_info(),
            system_program: system_program.to_account_info(),
        };
        let ctx = CpiContext::new(program, accounts);

        puppet::cpi::create_counter(ctx, state_bump)
    }
}
