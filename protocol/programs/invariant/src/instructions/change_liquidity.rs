use crate::interfaces::take_tokens::TakeTokens;
use crate::structs::pool::Pool;
use crate::structs::position::Position;
use crate::structs::tick::Tick;
use crate::ErrorCode::{self, *};
use crate::*;
use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token_2022;
use anchor_spl::token_interface::TokenInterface;
use anchor_spl::token_interface::{Mint, TokenAccount};
use decimals::*;
use interfaces::send_tokens::SendTokens;

#[derive(Accounts)]
#[instruction( index: u32)]
pub struct ChangeLiquidity<'info> {
    #[account(seeds = [b"statev1".as_ref()], bump = state.load()?.bump)]
    pub state: AccountLoader<'info, State>,
    #[account(mut,
        seeds = [b"positionv1",
        owner.key().as_ref(),
        &index.to_le_bytes()],
        bump = position.load()?.bump,
        constraint = position.load()?.pool == pool.key() @ InvalidPositionIndex
    )]
    pub position: AccountLoader<'info, Position>,
    #[account(mut,
        seeds = [b"poolv1", token_x.key().as_ref(), token_y.key().as_ref(), &pool.load()?.fee.v.to_le_bytes(), &pool.load()?.tick_spacing.to_le_bytes()],
        bump = pool.load()?.bump
    )]
    pub pool: AccountLoader<'info, Pool>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub owner: Signer<'info>,
    #[account(mut,
        seeds = [b"tickv1", pool.key().as_ref(), &position.load()?.lower_tick_index.to_le_bytes()],
        bump = lower_tick.load()?.bump
    )]
    pub lower_tick: AccountLoader<'info, Tick>,
    #[account(mut,
        seeds = [b"tickv1", pool.key().as_ref(), &position.load()?.upper_tick_index.to_le_bytes()],
        bump = upper_tick.load()?.bump
    )]
    pub upper_tick: AccountLoader<'info, Tick>,
    #[account(constraint = token_x.key() == pool.load()?.token_x @ InvalidTokenAccount, mint::token_program = token_x_program)]
    pub token_x: InterfaceAccount<'info, Mint>,
    #[account(constraint = token_y.key() == pool.load()?.token_y @ InvalidTokenAccount, mint::token_program = token_y_program)]
    pub token_y: InterfaceAccount<'info, Mint>,
    #[account(mut,
        constraint = account_x.mint == token_x.key() @ InvalidMint,
        constraint = &account_x.owner == owner.key @ InvalidOwner,
        token::token_program = token_x_program,
    )]
    pub account_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut,
        constraint = account_y.mint == token_y.key() @ InvalidMint,
        constraint = &account_y.owner == owner.key @ InvalidOwner,
        token::token_program = token_y_program,
    )]
    pub account_y: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut,
        constraint = reserve_x.mint == token_x.key() @ InvalidMint,
        constraint = &reserve_x.owner == program_authority.key @ InvalidOwner,
        constraint = reserve_x.key() == pool.load()?.token_x_reserve @ InvalidTokenAccount,
        token::token_program = token_x_program,
    )]
    pub reserve_x: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(mut,
        constraint = reserve_y.mint == token_y.key() @ InvalidMint,
        constraint = &reserve_y.owner == program_authority.key @ InvalidOwner,
        constraint = reserve_y.key() == pool.load()?.token_y_reserve @ InvalidTokenAccount,
        token::token_program = token_y_program,
    )]
    pub reserve_y: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(constraint = &state.load()?.authority == program_authority.key @ InvalidAuthority)]
    /// CHECK: ignore
    pub program_authority: AccountInfo<'info>,
    pub token_x_program: Interface<'info, TokenInterface>,
    pub token_y_program: Interface<'info, TokenInterface>,
}

impl<'info> TakeTokens<'info> for ChangeLiquidity<'info> {
    fn take_x(&self) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        CpiContext::new(
            self.token_x_program.to_account_info(),
            token::Transfer {
                from: self.account_x.to_account_info(),
                to: self.reserve_x.to_account_info(),
                authority: self.owner.to_account_info().clone(),
            },
        )
    }

    fn take_y(&self) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        CpiContext::new(
            self.token_y_program.to_account_info(),
            token::Transfer {
                from: self.account_y.to_account_info(),
                to: self.reserve_y.to_account_info(),
                authority: self.owner.to_account_info().clone(),
            },
        )
    }

    fn take_x_2022(&self) -> CpiContext<'_, '_, '_, 'info, token_2022::TransferChecked<'info>> {
        CpiContext::new(
            self.token_x_program.to_account_info(),
            token_2022::TransferChecked {
                mint: self.token_x.to_account_info(),
                from: self.account_x.to_account_info(),
                to: self.reserve_x.to_account_info(),
                authority: self.owner.to_account_info().clone(),
            },
        )
    }

    fn take_y_2022(&self) -> CpiContext<'_, '_, '_, 'info, token_2022::TransferChecked<'info>> {
        CpiContext::new(
            self.token_y_program.to_account_info(),
            token_2022::TransferChecked {
                mint: self.token_y.to_account_info(),
                from: self.account_y.to_account_info(),
                to: self.reserve_y.to_account_info(),
                authority: self.owner.to_account_info().clone(),
            },
        )
    }
}

impl<'info> SendTokens<'info> for ChangeLiquidity<'info> {
    fn send_x(&self) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        CpiContext::new(
            self.token_x_program.to_account_info(),
            token::Transfer {
                from: self.reserve_x.to_account_info(),
                to: self.account_x.to_account_info(),
                authority: self.program_authority.clone(),
            },
        )
    }

    fn send_y(&self) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        CpiContext::new(
            self.token_y_program.to_account_info(),
            token::Transfer {
                from: self.reserve_y.to_account_info(),
                to: self.account_y.to_account_info(),
                authority: self.program_authority.clone(),
            },
        )
    }

    fn send_x_2022(&self) -> CpiContext<'_, '_, '_, 'info, token_2022::TransferChecked<'info>> {
        CpiContext::new(
            self.token_x_program.to_account_info(),
            token_2022::TransferChecked {
                mint: self.token_x.to_account_info(),
                from: self.reserve_x.to_account_info(),
                to: self.account_x.to_account_info(),
                authority: self.program_authority.clone(),
            },
        )
    }

    fn send_y_2022(&self) -> CpiContext<'_, '_, '_, 'info, token_2022::TransferChecked<'info>> {
        CpiContext::new(
            self.token_y_program.to_account_info(),
            token_2022::TransferChecked {
                mint: self.token_y.to_account_info(),
                from: self.reserve_y.to_account_info(),
                to: self.account_y.to_account_info(),
                authority: self.program_authority.clone(),
            },
        )
    }
}

impl<'info> ChangeLiquidity<'info> {
    pub fn handler(
        &self,
        liquidity_delta: Liquidity,
        add_liquidity: bool,
        slippage_limit_lower: Price,
        slippage_limit_upper: Price,
    ) -> Result<()> {
        msg!("INVARIANT: CHANGE POSITION LIQUIDITY");

        let mut position = self.position.load_mut()?;
        let pool = &mut self.pool.load_mut()?;
        let lower_tick = &mut self.lower_tick.load_mut()?;
        let upper_tick = &mut self.upper_tick.load_mut()?;
        let current_timestamp = get_current_timestamp();
        let slot = get_current_slot();

        let liquidity = position.liquidity;
        require!(
            add_liquidity || liquidity_delta != liquidity,
            ErrorCode::PositionWithoutLiquidity
        );

        require!(liquidity_delta != Liquidity::new(0), ErrorCode::ZeroAmount);

        // validate price
        let sqrt_price = pool.sqrt_price;
        require!(
            sqrt_price >= slippage_limit_lower,
            ErrorCode::PriceLimitReached
        );
        require!(
            sqrt_price <= slippage_limit_upper,
            ErrorCode::PriceLimitReached
        );

        position.seconds_per_liquidity_inside = calculate_seconds_per_liquidity_inside(
            **lower_tick,
            **upper_tick,
            pool,
            current_timestamp,
        );
        position.last_slot = slot;

        let (amount_x, amount_y) = position.modify(
            pool,
            upper_tick,
            lower_tick,
            liquidity_delta,
            add_liquidity,
            current_timestamp,
        )?;

        require!(
            amount_x != TokenAmount::new(0) || amount_y != TokenAmount::new(0),
            ErrorCode::ZeroOutput
        );

        if add_liquidity {
            match self.token_x_program.key() {
                token_2022::ID => token_2022::transfer_checked(
                    self.take_x_2022(),
                    amount_x.0,
                    self.token_x.decimals,
                )?,
                token::ID => token::transfer(self.take_x(), amount_x.0)?,
                _ => return Err(ErrorCode::InvalidTokenProgram.into()),
            };
            match self.token_y_program.key() {
                token_2022::ID => token_2022::transfer_checked(
                    self.take_y_2022(),
                    amount_y.0,
                    self.token_y.decimals,
                )?,
                token::ID => token::transfer(self.take_y(), amount_y.0)?,
                _ => return Err(ErrorCode::InvalidTokenProgram.into()),
            };
        } else {
            let state = self.state.load()?;
            let signer: &[&[&[u8]]] = get_signer!(state.nonce);

            match self.token_x_program.key() {
                token_2022::ID => token_2022::transfer_checked(
                    self.send_x_2022().with_signer(signer),
                    amount_x.0,
                    self.token_x.decimals,
                )?,
                token::ID => token::transfer(self.send_x().with_signer(signer), amount_x.0)?,
                _ => return Err(ErrorCode::InvalidTokenProgram.into()),
            };

            match self.token_y_program.key() {
                token_2022::ID => token_2022::transfer_checked(
                    self.send_y_2022().with_signer(signer),
                    amount_y.0,
                    self.token_y.decimals,
                )?,
                token::ID => token::transfer(self.send_y().with_signer(signer), amount_y.0)?,
                _ => return Err(ErrorCode::InvalidTokenProgram.into()),
            };
        }

        Ok(())
    }
}
