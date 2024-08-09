mod counter;

pub use counter::Counter;

pub trait DerivedAccountIdentifier {
    const IDENT: &'static [u8];
}
