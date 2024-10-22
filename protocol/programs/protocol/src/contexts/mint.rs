use crate::decimals::{Liquidity, Price, TokenAmount};
use crate::math::{compute_lp_share_change, get_max_tick, get_min_tick};
use crate::states::{DerivedAccountIdentifier, LpPool, State, LP_TOKEN_IDENT};
use crate::{get_signer, ErrorCode::*};
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::{mint_to, MintTo, Token2022};
use anchor_spl::token_interface::{Mint, TokenAccount as ITokenAccount, TokenInterface};
use anchor_spl::{
    token::{self},
    token_2022,
};
use decimal::{BetweenDecimals, Decimal};
use invariant::cpi::accounts::{ChangeLiquidity, ClaimFee};
use invariant::decimals::{Liquidity as InvLiquidity, Price as InvPrice};
use invariant::structs::PositionList;
use invariant::{
    cpi::accounts::{CreatePosition, CreateTick},
    structs::{Pool, Position},
};

#[macro_export]
macro_rules! try_from {
    ($ty: ty, $acc: expr) => {
        <$ty>::try_from(unsafe { core::mem::transmute::<_, &AccountInfo<'_>>($acc.as_ref()) })
    };
}

const ADD: bool = true;

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
    pub position_list: AccountLoader<'info, PositionList>,
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

    pub fn deposit_x_2022(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token_2022::TransferChecked<'info>> {
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

    pub fn deposit_y_2022(
        &self,
    ) -> CpiContext<'_, '_, '_, 'info, token_2022::TransferChecked<'info>> {
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

    pub fn claim_fee(&self) -> CpiContext<'_, '_, '_, 'info, ClaimFee<'info>> {
        CpiContext::new(
            self.inv_program.to_account_info(),
            ClaimFee {
                state: self.inv_state.to_account_info(),
                pool: self.pool.to_account_info(),
                position: self.position.to_account_info(),
                lower_tick: self.lower_tick.to_account_info(),
                upper_tick: self.upper_tick.to_account_info(),
                owner: self.program_authority.to_account_info(),
                token_x: self.token_x.to_account_info(),
                token_y: self.token_y.to_account_info(),
                account_x: self.reserve_x.to_account_info(),
                account_y: self.reserve_y.to_account_info(),
                reserve_x: self.inv_reserve_x.to_account_info(),
                reserve_y: self.inv_reserve_y.to_account_info(),
                program_authority: self.inv_program_authority.to_account_info(),
                token_x_program: self.token_x_program.to_account_info(),
                token_y_program: self.token_y_program.to_account_info(),
            },
        )
    }

    pub fn change_liquidity(&self) -> CpiContext<'_, '_, '_, 'info, ChangeLiquidity<'info>> {
        CpiContext::new(
            self.inv_program.to_account_info(),
            ChangeLiquidity {
                state: self.inv_state.to_account_info(),
                program_authority: self.inv_program_authority.to_account_info(),
                owner: self.program_authority.to_account_info(),
                payer: self.owner.to_account_info(),
                position: self.position.to_account_info(),
                pool: self.pool.to_account_info(),
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

    pub fn create_position(&self) -> CpiContext<'_, '_, '_, 'info, CreatePosition<'info>> {
        CpiContext::new(
            self.inv_program.to_account_info(),
            CreatePosition {
                state: self.inv_state.to_account_info(),
                position: self.position.to_account_info(),
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
        if lp_pool.position_exists {
            let upper_tick_index = get_max_tick(lp_pool.tick_spacing);
            let lower_tick_index = get_min_tick(lp_pool.tick_spacing);
            let position_loader = try_from!(AccountLoader::<Position>, &self.position)?;
            let position = position_loader.load()?;
            require_eq!(position.upper_tick_index, upper_tick_index);
            require_eq!(position.lower_tick_index, lower_tick_index);

            let seeds = [
                b"positionv1",
                self.program_authority.key.as_ref(),
                &lp_pool.position_index.to_le_bytes(),
            ];
            let (position_key, position_bump) =
                Pubkey::find_program_address(&seeds, &invariant::ID);
            require_keys_eq!(position_key, self.position.key());
            require_eq!(position_bump, position.bump);
        }
        Ok(())
    }

    pub fn process(&mut self, liquidity: Liquidity) -> Result<()> {
        self.validate_pool()?;
        self.validate_token_lp()?;
        self.validate_position()?;

        let lp_pool = &mut self.lp_pool.load_mut()?;
        let Pool {
            sqrt_price,
            current_tick_index,
            ..
        } = *self.pool.load()?;
        let current_sqrt_price = Price::new(sqrt_price.v);
        let upper_tick_index = get_max_tick(lp_pool.tick_spacing);
        let lower_tick_index = get_min_tick(lp_pool.tick_spacing);

        let (unclaimed_fee_x, unclaimed_fee_y, current_liquidity) = if lp_pool.position_exists {
            let position = *try_from!(AccountLoader::<Position>, &self.position)?.load()?;
            let tokens_owed_x = TokenAmount::from_decimal(position.tokens_owed_x);
            let tokens_owed_y = TokenAmount::from_decimal(position.tokens_owed_y);
            let liquidity = Liquidity::new(position.liquidity.v);
            (tokens_owed_x, tokens_owed_y, liquidity)
        } else {
            (TokenAmount::new(0), TokenAmount::new(0), Liquidity::new(0))
        };

        let shares = compute_lp_share_change(
            ADD,
            TokenAmount::new(self.token_lp.supply),
            liquidity,
            current_liquidity,
            TokenAmount::new(lp_pool.leftover_x) + unclaimed_fee_x,
            TokenAmount::new(lp_pool.leftover_y) + unclaimed_fee_y,
            lp_pool.tick_spacing,
            current_tick_index,
            current_sqrt_price,
        )
        .unwrap();

        let (deposited_x, deposited_y) = shares.transferred_amounts;
        let (leftover_x, leftover_y) = shares.leftover_amounts;
        lp_pool.leftover_x = leftover_x.0;
        lp_pool.leftover_y = leftover_y.0;

        match self.token_x_program.key() {
            token_2022::ID => token_2022::transfer_checked(
                self.deposit_x_2022(),
                deposited_x.0,
                self.token_x.decimals,
            )?,
            token::ID => token::transfer(self.deposit_x(), deposited_x.0)?,
            _ => return Err(InvalidTokenProgram.into()),
        };

        match self.token_y_program.key() {
            token_2022::ID => token_2022::transfer_checked(
                self.deposit_y_2022(),
                deposited_y.0,
                self.token_y.decimals,
            )?,
            token::ID => token::transfer(self.deposit_y(), deposited_y.0)?,
            _ => return Err(InvalidTokenProgram.into()),
        };

        // update or open a position
        let signer: &[&[&[u8]]] = get_signer!(self.state.load()?.bump_authority);

        let added_liquidity = shares.liquidity_change.l.v;
        if lp_pool.position_exists {
            // TODO gas optimization: only claim fee if it will affect liquidity
            if unclaimed_fee_x + unclaimed_fee_y > TokenAmount::new(0) {
                invariant::cpi::claim_fee(
                    self.claim_fee().with_signer(signer),
                    lp_pool.position_index,
                    lower_tick_index,
                    upper_tick_index,
                )?;
            }

            invariant::cpi::change_liquidity(
                self.change_liquidity().with_signer(signer),
                lp_pool.position_index,
                InvLiquidity::new(added_liquidity),
                ADD,
                sqrt_price,
                sqrt_price,
            )?;
        } else {
            lp_pool.position_index = self.position_list.load()?.head;
            lp_pool.position_exists = true;
            invariant::cpi::create_position(
                self.create_position().with_signer(signer),
                lower_tick_index,
                upper_tick_index,
                InvLiquidity::new(added_liquidity),
                InvPrice::new(sqrt_price.v),
                InvPrice::new(sqrt_price.v),
            )?;
        }
        // mint LP tokens for user
        mint_to(
            self.mint_lp().with_signer(signer),
            shares.lp_token_change.unwrap_or_default().0,
        )
    }
}
