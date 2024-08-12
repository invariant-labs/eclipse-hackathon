use crate::size;

use super::DerivedAccountIdentifier;
use anchor_lang::prelude::*;

impl DerivedAccountIdentifier for State {
    const IDENT: &'static [u8] = b"PROTOCOLState";
}

#[account]
#[derive(Default, Debug, InitSpace)]
pub struct State {
    pub owner: Pubkey,
    pub counter: u8,
    pub bump: u8,
}

size!(State);
