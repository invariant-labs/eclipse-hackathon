use crate::structs::pool::Pool;
use crate::structs::State;
use crate::util::get_current_timestamp;
use crate::ErrorCode::*;
use crate::ErrorCode::{self};
use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use anchor_spl::token;
use anchor_spl::token_2022;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};
use std::cmp::Ordering;

#[derive(Accounts)]
pub struct InitReserves<'info> {
    #[account(seeds = [b"statev1".as_ref()], bump = state.load()?.bump)]
    pub state: AccountLoader<'info, State>,
    #[account(mut,
        seeds = [b"poolv1", token_x.to_account_info().key.as_ref(), token_y.to_account_info().key.as_ref(), &pool.load()?.fee.v.to_le_bytes(), &pool.load()?.tick_spacing.to_le_bytes()],
        bump = pool.load()?.bump
    )]
    pub pool: AccountLoader<'info, Pool>,

    #[account(
        mint::token_program = token_x_program
    )]
    pub token_x: Box<InterfaceAccount<'info, Mint>>,
    #[account(
        mint::token_program = token_y_program
    )]
    pub token_y: Box<InterfaceAccount<'info, Mint>>,

    #[account(init,
        token::mint = token_x,
        token::authority = authority,
        token::token_program = token_x_program,
        payer = payer,
    )]
    pub token_x_reserve: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(init,
        token::mint = token_y,
        token::authority = authority,
        token::token_program = token_y_program,
        payer = payer,
    )]
    pub token_y_reserve: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(constraint = &state.load()?.authority == authority.key @ InvalidAuthority)]
    /// CHECK: ignore
    pub authority: AccountInfo<'info>,

    #[account(constraint = token_x_program.key() == token::ID || token_x_program.key() == token_2022::ID)]
    pub token_x_program: Interface<'info, TokenInterface>,
    #[account(constraint = token_y_program.key() == token::ID || token_y_program.key() == token_2022::ID)]
    pub token_y_program: Interface<'info, TokenInterface>,
    #[account(address = system_program::ID)]
    /// CHECK: ignore
    pub system_program: AccountInfo<'info>,
}

impl<'info> InitReserves<'info> {
    pub fn handler(&self) -> Result<()> {
        msg!("INVARIANT: INIT RESERVES");

        let token_x_address = &self.token_x.key();
        let token_y_address = &self.token_y.key();
        require!(
            token_x_address
                .to_string()
                .cmp(&token_y_address.to_string())
                == Ordering::Less,
            ErrorCode::InvalidPoolTokenAddresses
        );

        let pool = &mut self.pool.load_mut()?;
        let current_timestamp = get_current_timestamp();

        pool.token_x_reserve = *self.token_x_reserve.to_account_info().key;
        pool.token_y_reserve = *self.token_y_reserve.to_account_info().key;
        pool.last_timestamp = current_timestamp;

        Ok(())
    }
}
