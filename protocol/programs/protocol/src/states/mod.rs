mod state;

pub use state::State;

pub trait DerivedAccountIdentifier {
    const IDENT: &'static [u8];
}
