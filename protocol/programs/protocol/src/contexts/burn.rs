use std::cell::RefMut;

use crate::math::{
    calculate_amount_delta, compute_lp_share_change, get_max_tick, get_min_tick,
    LiquidityChangeResult,
};
use crate::states::{DerivedAccountIdentifier, LpPool, State, LP_TOKEN_IDENT};
use crate::{decimals::*, try_from};
use crate::{get_signer, ErrorCode::*};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::{Burn, Token2022};
use anchor_spl::token_interface::{Mint, TokenAccount as ITokenAccount, TokenInterface};
use anchor_spl::{
    token::{self},
    token_2022,
};
use invariant::cpi::accounts::CreateTick;
use invariant::decimals::Liquidity as InvLiquidity;
use invariant::{
    cpi::accounts::{CreatePosition, RemovePosition},
    structs::{Pool, Position},
};

#[derive(Accounts)]
pub struct BurnLpTokenCtx<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        seeds = [State::IDENT],
        bump = state.load()?.bump
    )]
    pub state: AccountLoader<'info, State>,
    /// CHECK: cached from the state account
    #[account(mut)]
    #[account(constraint = &state.load()?.program_authority == program_authority.key @ InvalidAuthority)]
    pub program_authority: AccountInfo<'info>,
    #[account(mut,
        seeds = [LpPool::IDENT, token_x.key().as_ref(), token_y.key().as_ref(), &lp_pool.load()?.fee.v.to_le_bytes(), &lp_pool.load()?.tick_spacing.to_le_bytes()],
        bump=lp_pool.load()?.bump,
    )]
    pub lp_pool: AccountLoader<'info, LpPool>,
    #[account(mut,
        // validated in the handler!
        // seeds = [LP_TOKEN_IDENT, token_x.key().as_ref(), token_y.key().as_ref(), &lp_pool.load()?.fee.v.to_le_bytes(), &lp_pool.load()?.tick_spacing.to_le_bytes()],
        // bump=lp_pool.load()?.token_bump,
    )]
    pub token_lp: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut,
        associated_token::mint = token_x,
        associated_token::authority = program_authority,
        associated_token::token_program = token_x_program,
    )]
    pub reserve_x: Box<InterfaceAccount<'info, ITokenAccount>>,
    #[account(mut,
        associated_token::mint = token_y,
        associated_token::authority = program_authority,
        associated_token::token_program = token_y_program,
    )]
    pub reserve_y: Box<InterfaceAccount<'info, ITokenAccount>>,
    #[account(mut,
        associated_token::mint = token_lp,
        associated_token::authority = owner,
        associated_token::token_program = token_program,
    )]
    pub account_lp: Box<InterfaceAccount<'info, ITokenAccount>>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// INVARIANT
    /// CHECK: passed to Invariant
    pub inv_program: UncheckedAccount<'info>,
    /// CHECK: passed to Invariant
    pub inv_state: UncheckedAccount<'info>,
    /// CHECK: invariant_program_authority is the authority of the Invariant program
    pub inv_program_authority: UncheckedAccount<'info>,
    /// CHECK: might not exist, explicit check in the handler
    #[account(mut)]
    pub position: AccountInfo<'info>,
    /// CHECK: might not exist, check in Invariant CPI
    #[account(mut)]
    pub last_position: UncheckedAccount<'info>,
    #[account(mut,
        // validated in the handler!
        // seeds = [INVARIANT_POOL_IDENT, token_x.key().as_ref(), token_y.key().as_ref(), &lp_pool.load()?.fee.v.to_le_bytes(), &lp_pool.load()?.tick_spacing.to_le_bytes()],
        // bump=pool.load()?.bump,
        // seeds::program = invariant::ID
        // OR
        // constraint = pool.load()?.token_x == token_x.key() && pool.load()?.token_y == token_y.key(),
        // constraint = pool.load()?.tick_spacing == lp_pool.load()?.tick_spacing,
        // constraint = pool.load()?.fee.v == lp_pool.load()?.fee.v
    )]
    pub pool: AccountLoader<'info, Pool>,
    /// CHECK: passed to Invariant
    #[account(mut)]
    pub position_list: UncheckedAccount<'info>,
    /// CHECK: passed to Invariant
    #[account(mut)]
    pub lower_tick: UncheckedAccount<'info>,
    /// CHECK: passed to Invariant
    #[account(mut)]
    pub upper_tick: UncheckedAccount<'info>,
    /// CHECK: passed to Invariant
    #[account(mut)]
    pub tickmap: UncheckedAccount<'info>,
    pub token_x: Box<InterfaceAccount<'info, Mint>>,
    pub token_y: Box<InterfaceAccount<'info, Mint>>,
    #[account(mut)]
    pub account_x: Box<InterfaceAccount<'info, ITokenAccount>>,
    #[account(mut)]
    pub account_y: Box<InterfaceAccount<'info, ITokenAccount>>,
    #[account(mut)]
    pub inv_reserve_x: Box<InterfaceAccount<'info, ITokenAccount>>,
    #[account(mut)]
    pub inv_reserve_y: Box<InterfaceAccount<'info, ITokenAccount>>,
    pub token_x_program: Interface<'info, TokenInterface>,
    pub token_y_program: Interface<'info, TokenInterface>,
    /// CHECK: passed to Invariant
    pub rent: UncheckedAccount<'info>,
    /// CHECK: no inits here, passed to Invariant
    pub system_program: UncheckedAccount<'info>,
}

impl<'info> BurnLpTokenCtx<'info> {
    pub fn burn_lp(&self) -> CpiContext<'_, '_, '_, 'info, Burn<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Burn {
                mint: self.token_lp.to_account_info(),
                from: self.account_lp.to_account_info(),
                authority: self.owner.to_account_info(),
            },
        )
    }

    pub fn withdraw_x(&self) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        CpiContext::new(
            self.token_x_program.to_account_info(),
            token::Transfer {
                from: self.reserve_x.to_account_info(),
                to: self.account_x.to_account_info(),
                authority: self.program_authority.to_account_info(),
            },
        )
    }
    pub fn withdraw_x_2022(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token_2022::TransferChecked<'info>> {
        CpiContext::new(
            self.token_x_program.to_account_info(),
            token_2022::TransferChecked {
                to: self.account_x.to_account_info(),
                from: self.reserve_x.to_account_info(),
                mint: self.token_x.to_account_info(),
                authority: self.program_authority.to_account_info(),
            },
        )
    }

    pub fn withdraw_y(&self) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        CpiContext::new(
            self.token_y_program.to_account_info(),
            token::Transfer {
                from: self.reserve_y.to_account_info(),
                to: self.account_y.to_account_info(),
                authority: self.program_authority.to_account_info(),
            },
        )
    }
    pub fn withdraw_y_2022(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token_2022::TransferChecked<'info>> {
        CpiContext::new(
            self.token_y_program.to_account_info(),
            token_2022::TransferChecked {
                to: self.account_y.to_account_info(),
                mint: self.token_y.to_account_info(),
                from: self.reserve_y.to_account_info(),
                authority: self.program_authority.to_account_info(),
            },
        )
    }

    pub fn remove_position(&self) -> CpiContext<'_, '_, '_, 'info, RemovePosition<'info>> {
        CpiContext::new(
            self.inv_program.to_account_info(),
            RemovePosition {
                state: self.inv_state.to_account_info(),
                program_authority: self.inv_program_authority.to_account_info(),
                owner: self.program_authority.to_account_info(),
                removed_position: self.position.to_account_info(),
                position_list: self.position_list.to_account_info(),
                last_position: self.last_position.to_account_info(),
                pool: self.pool.to_account_info(),
                tickmap: self.tickmap.to_account_info(),
                lower_tick: self.lower_tick.to_account_info(),
                upper_tick: self.upper_tick.to_account_info(),
                token_x: self.token_x.to_account_info(),
                token_y: self.token_y.to_account_info(),
                account_x: self.reserve_x.to_account_info(),
                account_y: self.reserve_y.to_account_info(),
                reserve_x: self.inv_reserve_x.to_account_info(),
                reserve_y: self.inv_reserve_y.to_account_info(),
                token_x_program: self.token_x_program.to_account_info(),
                token_y_program: self.token_y_program.to_account_info(),
            },
        )
    }

    pub fn create_tick(
        &self,
        account: AccountInfo<'info>,
    ) -> CpiContext<'_, '_, '_, 'info, CreateTick<'info>> {
        CpiContext::new(
            self.inv_program.to_account_info(),
            CreateTick {
                tick: account,
                pool: self.pool.to_account_info(),
                tickmap: self.tickmap.to_account_info(),
                payer: self.owner.to_account_info(),
                token_x: self.token_x.to_account_info(),
                token_y: self.token_y.to_account_info(),
                token_x_program: self.token_x_program.to_account_info(),
                token_y_program: self.token_y_program.to_account_info(),
                rent: self.rent.to_account_info(),
                system_program: self.system_program.to_account_info(),
            },
        )
    }

    pub fn create_position(&self) -> CpiContext<'_, '_, '_, 'info, CreatePosition<'info>> {
        CpiContext::new(
            self.inv_program.to_account_info(),
            CreatePosition {
                state: self.inv_state.to_account_info(),
                // the previous last position was moved to the previous' address
                position: self.last_position.to_account_info(),
                pool: self.pool.to_account_info(),
                position_list: self.position_list.to_account_info(),
                payer: self.owner.to_account_info(),
                owner: self.program_authority.to_account_info(),
                lower_tick: self.lower_tick.to_account_info(),
                upper_tick: self.upper_tick.to_account_info(),
                tickmap: self.tickmap.to_account_info(),
                token_x: self.token_x.to_account_info(),
                token_y: self.token_y.to_account_info(),
                account_x: self.reserve_x.to_account_info(),
                account_y: self.reserve_y.to_account_info(),
                reserve_x: self.inv_reserve_x.to_account_info(),
                reserve_y: self.inv_reserve_y.to_account_info(),
                program_authority: self.inv_program_authority.to_account_info(),
                token_x_program: self.token_x_program.to_account_info(),
                token_y_program: self.token_y_program.to_account_info(),
                rent: self.rent.to_account_info(),
                system_program: self.system_program.to_account_info(),
            },
        )
    }

    pub fn validate_pool(&self) -> Result<()> {
        let lp_pool = &self.lp_pool.load()?;
        let pool = &self.pool.load()?;
        require_keys_eq!(pool.token_x, self.token_x.key());
        require_keys_eq!(pool.token_y, self.token_y.key());
        require_eq!(pool.fee.v, lp_pool.fee.v);
        require_eq!(pool.tick_spacing, lp_pool.tick_spacing);
        Ok(())
    }

    pub fn validate_token_lp(&self) -> Result<()> {
        let lp_pool = &self.lp_pool.load()?;
        let token_x = self.token_x.key();
        let token_y = self.token_y.key();
        let seeds = [
            LP_TOKEN_IDENT,
            token_x.as_ref(),
            token_y.as_ref(),
            &lp_pool.fee.v.to_le_bytes(),
            &lp_pool.tick_spacing.to_le_bytes(),
        ];
        let (pubkey, token_bump) = Pubkey::find_program_address(&seeds, &crate::ID);
        require_keys_eq!(pubkey, self.token_lp.key());
        require_eq!(token_bump, lp_pool.token_bump);
        Ok(())
    }

    pub fn validate_position(&self) -> Result<()> {
        let lp_pool = &self.lp_pool.load()?;
        if lp_pool.invariant_position != Pubkey::default() {
            let upper_tick_index = get_max_tick(lp_pool.tick_spacing);
            let lower_tick_index = get_min_tick(lp_pool.tick_spacing);
            let position = try_from!(AccountLoader::<Position>, &self.position)?;
            require_eq!(position.load()?.upper_tick_index, upper_tick_index);
            require_eq!(position.load()?.lower_tick_index, lower_tick_index);

            require_keys_eq!(self.position.key(), self.last_position.key());
            let owner = self.program_authority.key();
            let seeds = [b"positionv1", owner.as_ref(), &0i32.to_le_bytes()];
            let (pubkey, _bump) = Pubkey::find_program_address(&seeds, &invariant::ID);
            require_keys_eq!(self.last_position.key(), pubkey);
        }
        Ok(())
    }

    pub fn process(&mut self, liquidity_delta: Liquidity, index: u32) -> Result<()> {
        self.validate_pool()?;
        self.validate_token_lp()?;
        self.validate_position()?;

        let position = *try_from!(AccountLoader::<Position>, &self.position)?.load()?;

        let pool: Pool = *self.pool.load()?;
        let mut lp_pool: RefMut<LpPool> = self.lp_pool.load_mut()?;
        let current_tick_index = pool.current_tick_index;
        let fee_x = TokenAmount::from_decimal(position.tokens_owed_x);
        let fee_y = TokenAmount::from_decimal(position.tokens_owed_y);

        let current_liquidity = Liquidity::new(position.liquidity.v);

        let lower_tick_index = position.lower_tick_index;
        let upper_tick_index = position.upper_tick_index;
        let (amount_x, amount_y) = calculate_amount_delta(
            Price::new(pool.sqrt_price.v),
            current_liquidity,
            false,
            current_tick_index,
            lower_tick_index,
            upper_tick_index,
        )
        .map_err(|_| InvalidShares)?;

        let total_x = TokenAmount::new(lp_pool.leftover_x) + amount_x + fee_x;
        let total_y = TokenAmount::new(lp_pool.leftover_y) + amount_y + fee_y;

        let LiquidityChangeResult {
            positions_details,
            transferred_amounts,
            lp_token_change,
            leftover_amounts,
        } = compute_lp_share_change(
            false,
            TokenAmount(self.token_lp.supply),
            liquidity_delta,
            total_x,
            total_y,
            lp_pool.tick_spacing,
            current_tick_index,
            Price::new(pool.sqrt_price.v),
        )
        .unwrap();

        lp_pool.leftover_x = leftover_amounts.0.get();
        lp_pool.leftover_x = leftover_amounts.1.get();
        let lp_token_amount =
            lp_token_change.expect("Lp change can't be zero when liquidity delta is not zero");
        let (transfer_x, transfer_y) = transferred_amounts;

        let signer: &[&[&[u8]]] = get_signer!(self.state.load()?.bump_authority);
        // burn lp token
        token_2022::burn(self.burn_lp().with_signer(signer), lp_token_amount.get())?;

        // TODO: move and track index inside of LpPool
        invariant::cpi::remove_position(
            self.remove_position().with_signer(signer),
            index,
            lower_tick_index,
            upper_tick_index,
        )?;

        match self.token_x_program.key() {
            token_2022::ID => token_2022::transfer_checked(
                self.withdraw_x_2022().with_signer(signer),
                transfer_x.0,
                self.token_x.decimals,
            )?,
            token::ID => token::transfer(self.withdraw_x().with_signer(signer), transfer_x.0)?,
            _ => return Err(InvalidTokenProgram.into()),
        };

        match self.token_y_program.key() {
            token_2022::ID => token_2022::transfer_checked(
                self.withdraw_y_2022().with_signer(signer),
                transfer_y.0,
                self.token_y.decimals,
            )?,
            token::ID => token::transfer(self.withdraw_y().with_signer(signer), transfer_y.0)?,
            _ => return Err(InvalidTokenProgram.into()),
        };

        if positions_details.liquidity.v != 0 {
            invariant::cpi::create_tick(
                self.create_tick(self.lower_tick.to_account_info()),
                lower_tick_index,
            )?;

            invariant::cpi::create_tick(
                self.create_tick(self.upper_tick.to_account_info()),
                upper_tick_index,
            )?;

            invariant::cpi::create_position(
                self.create_position().with_signer(signer),
                positions_details.lower_tick,
                positions_details.upper_tick,
                InvLiquidity::new(positions_details.liquidity.v),
                pool.sqrt_price,
                pool.sqrt_price,
            )?;

            let new_position = try_from!(AccountLoader::<Position>, &self.last_position)?;
            lp_pool.position_bump = new_position.load()?.bump;
            lp_pool.invariant_position = self.last_position.key();
        } else {
            lp_pool.position_bump = 0;
            lp_pool.invariant_position = Pubkey::default();
        };

        Ok(())
    }
}
