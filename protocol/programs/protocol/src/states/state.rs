use super::DerivedAccountIdentifier;
use anchor_lang::prelude::*;

impl DerivedAccountIdentifier for State {
    const IDENT: &'static [u8] = b"PROTOCOLState";
}

#[account]
#[derive(Default, Debug)]
pub struct State {
    pub owner: Pubkey,
    pub counter: u8,
    pub bump: u8,
}
