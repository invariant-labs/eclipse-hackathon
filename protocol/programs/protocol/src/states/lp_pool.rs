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
    pub invariant_position: Pubkey,
    pub position_bump: u8,
    pub leftover_x: u64,
    pub leftover_y: u64,
    pub token_x: Pubkey,
    pub token_y: Pubkey,
    pub tick_spacing: u16,
    pub fee: FixedPoint,
    pub token_bump: u8,
    pub bump: u8,
}

size!(LpPool);
