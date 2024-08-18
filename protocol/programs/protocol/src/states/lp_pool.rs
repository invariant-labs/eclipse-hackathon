use crate::{decimals::FixedPoint, size};

use super::DerivedAccountIdentifier;
use anchor_lang::prelude::*;

impl DerivedAccountIdentifier for LpPool {
    const IDENT: &'static [u8] = b"poolv1";
}
#[account(zero_copy(unsafe))]
#[repr(packed)]
#[derive(PartialEq, Default, Debug, InitSpace)]
pub struct LpPool {
    pub token_lp: Pubkey,
    // TODO: likely should be Option<> and map to Invariant's position list's current position (if exists)
    pub position_index: u32,
    // TODO: these fields are likely unecessary since we make these ATAs
    pub reserve_x: Pubkey,
    pub reserve_y: Pubkey,
    pub token_x: Pubkey,
    pub token_y: Pubkey,
    pub leftover_x: u64,
    pub leftover_y: u64,
    pub tick_spacing: u16,
    pub fee: FixedPoint,
    pub bump: u8,
}

size!(LpPool);
