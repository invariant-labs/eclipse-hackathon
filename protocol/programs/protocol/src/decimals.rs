use core::convert::TryFrom;
use core::convert::TryInto;
pub use decimal::*;

use anchor_lang::prelude::*;

use crate::utils::{TrackableError, TrackableResult};
use crate::{err, function, location};

pub const PRICE_LIQUIDITY_DENOMINATOR: u128 = 1__0000_0000__0000_0000__00u128;

#[decimal(24)]
#[zero_copy]
#[derive(
    Default, std::fmt::Debug, PartialEq, Eq, PartialOrd, Ord, AnchorSerialize, AnchorDeserialize,
)]
pub struct Price {
    pub v: u128,
}

#[decimal(6)]
#[zero_copy]
#[derive(
    Default, std::fmt::Debug, PartialEq, Eq, PartialOrd, Ord, AnchorSerialize, AnchorDeserialize,
)]
pub struct Liquidity {
    pub v: u128,
}

#[decimal(24)]
#[zero_copy]
#[derive(
    Default, std::fmt::Debug, PartialEq, Eq, PartialOrd, Ord, AnchorSerialize, AnchorDeserialize,
)]
pub struct FeeGrowth {
    pub v: u128,
}

#[decimal(12)]
#[zero_copy]
#[derive(
    Default, std::fmt::Debug, PartialEq, Eq, PartialOrd, Ord, AnchorSerialize, AnchorDeserialize,
)]
pub struct FixedPoint {
    pub v: u128,
}

// legacy not serializable may implement later
#[decimal(0)]
#[zero_copy]
#[derive(
    Default, std::fmt::Debug, PartialEq, Eq, PartialOrd, Ord, AnchorSerialize, AnchorDeserialize,
)]
pub struct TokenAmount {
    pub v: u64,
}

impl FeeGrowth {
    pub fn unchecked_add(self, other: FeeGrowth) -> FeeGrowth {
        FeeGrowth::new(self.get() + other.get())
    }

    pub fn unchecked_sub(self, other: FeeGrowth) -> FeeGrowth {
        FeeGrowth::new(self.get() - other.get())
    }

    pub fn from_fee(liquidity: Liquidity, fee: TokenAmount) -> Self {
        FeeGrowth::new(
            U256::from(fee.get())
                .checked_mul(FeeGrowth::one())
                .unwrap()
                .checked_mul(Liquidity::one())
                .unwrap()
                .checked_div(liquidity.here())
                .unwrap()
                .try_into()
                .unwrap(),
        )
    }

    pub fn to_fee(self, liquidity: Liquidity) -> FixedPoint {
        FixedPoint::new(
            U256::try_from(self.get())
                .unwrap()
                .checked_mul(liquidity.here())
                .unwrap()
                .checked_div(U256::from(10).pow(U256::from(
                    FeeGrowth::scale() + Liquidity::scale() - FixedPoint::scale(),
                )))
                .unwrap()
                .try_into()
                .unwrap_or_else(|_| panic!("value too big to parse in `FeeGrowth::to_fee`")),
        )
    }
}

impl FixedPoint {
    pub fn unchecked_add(self, other: FixedPoint) -> FixedPoint {
        FixedPoint::new(self.get() + other.get())
    }

    pub fn unchecked_sub(self, other: FixedPoint) -> FixedPoint {
        FixedPoint::new(self.get() - other.get())
    }
}

impl Price {
    pub fn big_div_values_to_token(nominator: U256, denominator: U256) -> Option<TokenAmount> {
        let token_amount = nominator
            .checked_mul(Self::one::<U256>())?
            .checked_div(denominator)?
            .checked_div(Self::one::<U256>())?
            .try_into()
            .ok()?;
        Some(TokenAmount::new(token_amount))
    }

    pub fn big_div_values_to_token_up(nominator: U256, denominator: U256) -> Option<TokenAmount> {
        let token_amount = nominator
            .checked_mul(Self::one::<U256>())?
            .checked_add(denominator - 1)?
            .checked_div(denominator)?
            .checked_add(Self::almost_one::<U256>())?
            .checked_div(Self::one::<U256>())?
            .try_into()
            .ok()?;

        Some(TokenAmount::new(token_amount))
    }

    pub fn big_div_values_up(nominator: U256, denominator: U256) -> Price {
        Price::new({
            nominator
                .checked_mul(Self::one::<U256>())
                .unwrap()
                .checked_add(denominator.checked_sub(U256::from(1u32)).unwrap())
                .unwrap()
                .checked_div(denominator)
                .unwrap()
                .try_into()
                .unwrap()
        })
    }

    pub fn checked_big_div_values_up(nominator: U256, denominator: U256) -> TrackableResult<Price> {
        Ok(Price::new(
            nominator
                .checked_mul(Self::one::<U256>())
                .ok_or_else(|| err!(TrackableError::MUL))?
                .checked_add(
                    denominator
                        .checked_sub(U256::from(1u32))
                        .ok_or_else(|| err!(TrackableError::SUB))?,
                )
                .ok_or_else(|| err!(TrackableError::ADD))?
                .checked_div(denominator)
                .ok_or_else(|| err!(TrackableError::DIV))?
                .try_into()
                .map_err(|_| err!(TrackableError::cast::<Self>().as_str()))?,
        ))
    }
}
