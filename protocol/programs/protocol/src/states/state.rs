use super::DerivedAccountIdentifier;
use anchor_lang::prelude::*;

impl DerivedAccountIdentifier for State {
    const IDENT: &'static [u8] = b"PROTOCOLState";
}
#[account(zero_copy)]
#[repr(packed)]
#[derive(PartialEq, Default, Debug)]
pub struct State {
    pub admin: Pubkey,
    pub program_authority: Pubkey,
    pub counter: u8,
    pub bump: u8,
    pub bump_authority: u8,
}
