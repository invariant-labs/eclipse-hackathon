mod state;

pub use state::State;

pub trait DerivedAccountIdentifier {
    const IDENT: &'static [u8];
}

#[macro_export]
macro_rules! size {
    ($name: ident) => {
        impl $name {
            pub const LEN: usize = $name::INIT_SPACE + 8;
        }
    };
}
