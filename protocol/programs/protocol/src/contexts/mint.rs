use crate::decimals::{Liquidity, Price, TokenAmount};
use crate::math::{calculate_amount_delta, get_max_tick};
use crate::states::{
    DerivedAccountIdentifier, LpPool, State, INVARIANT_POOL_IDENT, LP_TOKEN_IDENT,
};
use crate::{get_signer, ErrorCode::*};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::{token::{self, TokenAccount}, token_2022};
use anchor_spl::token_2022::{mint_to, MintTo, Token2022};
use anchor_spl::token_interface::{Mint, TokenAccount as ITokenAccount, TokenInterface};
use decimal::Factories;
use invariant::decimals::{Liquidity as InvLiquidity, Price as InvPrice};
use invariant::{
    cpi::accounts::{CreatePosition, RemovePosition},
    program::Invariant,
    structs::{Pool, Position, PositionList, State as InvariantState, Tick, Tickmap},
};

#[macro_export]
macro_rules! try_from {
    ($ty: ty, $acc: expr) => {
        <$ty>::try_from(unsafe { core::mem::transmute::<_, &AccountInfo<'_>>($acc.as_ref()) })
    };
}

#[derive(Accounts)]
pub struct MintLpTokenCtx<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        seeds = [State::IDENT],
        bump = state.load()?.bump
    )]
    pub state: AccountLoader<'info, State>,
    /// CHECK: cached from the state account
    #[account(constraint = &state.load()?.program_authority == program_authority.key @ InvalidAuthority)]
    pub program_authority: AccountInfo<'info>,
    #[account(mut,
        seeds = [LpPool::IDENT, token_x.key().as_ref(), token_y.key().as_ref(), &lp_pool.load()?.fee.v.to_le_bytes(), &lp_pool.load()?.tick_spacing.to_le_bytes()],
        bump=lp_pool.load()?.bump,
    )]
    pub lp_pool: AccountLoader<'info, LpPool>,
    #[account(mut,
        seeds = [LP_TOKEN_IDENT, token_x.key().as_ref(), token_y.key().as_ref(), &lp_pool.load()?.fee.v.to_le_bytes(), &lp_pool.load()?.tick_spacing.to_le_bytes()],
        bump=lp_pool.load()?.token_bump,
    )]
    pub token_lp: InterfaceAccount<'info, Mint>,
    #[account(mut,
        associated_token::mint = token_x,
        associated_token::authority = program_authority)]
    pub reserve_x: InterfaceAccount<'info, ITokenAccount>,
    #[account(mut,
        associated_token::mint = token_y,
        associated_token::authority = program_authority)]
    pub reserve_y: InterfaceAccount<'info, ITokenAccount>,
    #[account(init_if_needed,
        payer = owner, 
        associated_token::mint = token_lp, 
        associated_token::authority = owner
    )]
    pub account_lp: InterfaceAccount<'info, ITokenAccount>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    /// INVARIANT
    pub inv_program: Program<'info, Invariant>,
    pub inv_state: AccountLoader<'info, InvariantState>,
    /// CHECK: invariant_program_authority is the authority of the Invariant program
    pub inv_program_authority: AccountInfo<'info>,
    // might not exist, explicit check in the handler
    #[account(mut)]
    pub position: AccountInfo<'info>,
    // might not exist, check in Invariant CPI
    #[account(mut)]
    pub last_position: UncheckedAccount<'info>,
    #[account(mut,
        seeds = [INVARIANT_POOL_IDENT, token_x.key().as_ref(), token_y.key().as_ref(), &lp_pool.load()?.fee.v.to_le_bytes(), &lp_pool.load()?.tick_spacing.to_le_bytes()],
        bump=pool.load()?.bump,
        seeds::program = invariant::ID
    )]
    pub pool: AccountLoader<'info, Pool>,
    #[account(mut)]
    pub position_list: AccountLoader<'info, PositionList>,
    // TODO: check if lowest tick possible
    #[account(mut)]
    pub lower_tick: AccountLoader<'info, Tick>,
    // TODO: check if highest tick possible
    #[account(mut)]
    pub upper_tick: AccountLoader<'info, Tick>,
    #[account(mut)]
    pub tickmap: AccountLoader<'info, Tickmap>,
    pub token_x: InterfaceAccount<'info, Mint>,
    pub token_y: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub account_x: InterfaceAccount<'info, ITokenAccount>,
    #[account(mut)]
    pub account_y: InterfaceAccount<'info, ITokenAccount>,
    #[account(mut)]
    pub inv_reserve_x: Box<InterfaceAccount<'info, ITokenAccount>>,
    #[account(mut)]
    pub inv_reserve_y: Box<InterfaceAccount<'info, ITokenAccount>>,
    #[account(constraint = token_x_program.key() == token::ID || token_x_program.key() == token_2022::ID)]
    pub token_x_program: Interface<'info, TokenInterface>,
    #[account(constraint = token_y_program.key() == token::ID || token_y_program.key() == token_2022::ID)]
    pub token_y_program: Interface<'info, TokenInterface>,
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
}

impl<'info> MintLpTokenCtx<'info> {
    pub fn mint_lp(&self) -> CpiContext<'_, '_, '_, 'info, MintTo<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            MintTo {
                mint: self.token_lp.to_account_info(),
                to: self.account_lp.to_account_info(),
                authority: self.program_authority.to_account_info(),
            },
        )
    }

    pub fn deposit_x(&self) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        CpiContext::new(
            self.token_x_program.to_account_info(),
            token::Transfer {
                from: self.account_x.to_account_info(),
                to: self.reserve_x.to_account_info(),
                authority: self.owner.to_account_info(),
            },
        )
    }
    pub fn deposit_x_2022(&self) -> CpiContext<'_, '_, '_, 'info, token_2022::TransferChecked<'info>> {
        CpiContext::new(
            self.token_x_program.to_account_info(),
            token_2022::TransferChecked {
                from: self.account_x.to_account_info(),
                mint: self.token_x.to_account_info(),
                to: self.reserve_x.to_account_info(),
                authority: self.owner.to_account_info(),
            },
        )
    }

    pub fn deposit_y(&self) -> CpiContext<'_, '_, '_, 'info, token::Transfer<'info>> {
        CpiContext::new(
            self.token_y_program.to_account_info(),
            token::Transfer {
                from: self.account_y.to_account_info(),
                to: self.reserve_y.to_account_info(),
                authority: self.owner.to_account_info(),
            },
        )
    }
    pub fn deposit_y_2022(&self) -> CpiContext<'_, '_, '_, 'info, token_2022::TransferChecked<'info>> {
        CpiContext::new(
            self.token_y_program.to_account_info(),
            token_2022::TransferChecked {
                from: self.account_y.to_account_info(),
                mint: self.token_y.to_account_info(),
                to: self.reserve_y.to_account_info(),
                authority: self.owner.to_account_info(),
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
                account_x: self.account_x.to_account_info(),
                account_y: self.account_y.to_account_info(),
                reserve_x: self.inv_reserve_x.to_account_info(),
                reserve_y: self.inv_reserve_y.to_account_info(),
                token_x_program: self.token_x_program.to_account_info(),
                token_y_program: self.token_y_program.to_account_info(),
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
                account_x: self.account_x.to_account_info(),
                account_y: self.account_y.to_account_info(),
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
// }
    // impl MintLpTokenCtx<'_> {
    pub fn process(&mut self, liquidity: Liquidity, index: u32) -> Result<()> {
        let lp_pool = self.lp_pool.load()?;
        let Pool { sqrt_price, current_tick_index, .. } = *self.pool.load()?;
        let sqrt_price = Price::from_integer(sqrt_price.v);
        let upper_tick_index = get_max_tick(lp_pool.tick_spacing);
        let lower_tick_index = -upper_tick_index;

        let dummy_test_val_please_remove = liquidity.v;

        // let (required_x, required_y) = calculate_amount_delta(sqrt_price, liquidity, true, current_tick_index, lower_tick_index, upper_tick_index).unwrap();
        let (required_x, required_y) = (TokenAmount::from_integer(dummy_test_val_please_remove), TokenAmount::from_integer(dummy_test_val_please_remove));
        match self.token_x_program.key() {
            token_2022::ID => token_2022::transfer_checked(
                self.deposit_x_2022(),
                required_x.0,
                self.token_x.decimals,
            )?,
            token::ID => token::transfer(self.deposit_x(), required_x.0)?,
            _ => return Err(InvalidTokenProgram.into()),
        };

        match self.token_y_program.key() {
            token_2022::ID => token_2022::transfer_checked(
                self.deposit_y_2022(),
                required_y.0,
                self.token_y.decimals,
            )?,
            token::ID => token::transfer(self.deposit_y(), required_y.0)?,
            _ => return Err(InvalidTokenProgram.into()),
        };
        
        let init_liquidity = if lp_pool.invariant_position != Pubkey::default() {
            // let position = try_from!(AccountLoader::<Position>, &self.position)?;
            // let val = position.load()?.liquidity.v;
            // Liquidity::from_integer(val)
            Liquidity::from_integer(0)
        }
        else {
            Liquidity::from_integer(0)
        };
        
        if lp_pool.invariant_position != Pubkey::default()
        {
            // TODO: move and track index inside of LpPool
            // invariant::cpi::remove_position(self.remove_position(), index, lower_tick_index, upper_tick_index)?;
        }
        {
            // invariant::cpi::create_position(
            //     self.create_position(),
            //     lower_tick_index,
            //     upper_tick_index,
            //     InvLiquidity::from_integer(init_liquidity.v + dummy_test_val_please_remove),
            //     InvPrice::from_integer(sqrt_price.v),
            //     InvPrice::from_integer(sqrt_price.v),
            // )?;
        }

        let signer: &[&[&[u8]]] = get_signer!(self.state.load()?.bump_authority);
        mint_to(self.mint_lp().with_signer(signer), dummy_test_val_please_remove as u64)
    }
}
