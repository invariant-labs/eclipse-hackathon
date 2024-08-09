use crate::size;

use super::DerivedAccountIdentifier;
use anchor_lang::prelude::*;

impl DerivedAccountIdentifier for Counter {
    const IDENT: &'static [u8] = b"PUPPETCounter";
}

#[account]
#[derive(Default, Debug, InitSpace)]
pub struct Counter {
    pub owner: Pubkey,
    pub counter: u8,
    pub bump: u8,
}

size!(Counter);
