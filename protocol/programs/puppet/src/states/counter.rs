use super::DerivedAccountIdentifier;
use anchor_lang::prelude::*;

impl DerivedAccountIdentifier for Counter {
    const IDENT: &'static [u8] = b"PUPPETCounter";
}

#[account]
#[derive(Default, Debug)]
pub struct Counter {
    pub owner: Pubkey,
    pub counter: u8,
    pub bump: u8,
}

impl Counter {
    pub const LEN: usize = 32 + 1 + 1;
}
