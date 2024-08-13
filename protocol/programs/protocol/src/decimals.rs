use anchor_lang::prelude::*;
use decimal::*;

#[decimal(24)]
#[zero_copy]
#[derive(
    Default,
    std::fmt::Debug,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    AnchorSerialize,
    AnchorDeserialize,
    InitSpace,
)]
pub struct Price {
    pub v: u128,
}

#[decimal(6)]
#[zero_copy]
#[derive(
    Default,
    std::fmt::Debug,
    PartialEq,
    Eq,
    PartialOrd,
    Ord,
    AnchorSerialize,
    AnchorDeserialize,
    InitSpace,
)]
pub struct Liquidity {
    pub v: u128,
}
