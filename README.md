# eclipse-hackathon

## Protocol

### Prerequisites

- System: Mac or Linux
- [Rust](https://rustup.rs/)
- [Solana](https://docs.solanalabs.com/cli/install), v1.18.12 or later
- [Anchor](https://www.anchor-lang.com/docs/installation) Install Anchor version manager (avm), then Anchor 0.29.0

## Commands

### Build all

```bash
./build.sh
```

### Test all

```bash
./tests.sh
```

### Build Program

```bash
anchor build
```

### Build SDK

```bash
cd sdk
npm i
npm run build
```

### Run unit tests

```bash
cargo test
```

### Run e2e tests

```bash
npm i
./tests.sh
```

## Math

### Auxiliary functions

#### Get $max(t)$ based on $s(t)$


Computes the max tick for given tick spacing.

```rust
pub fn get_max_tick(tick_spacing: u16) -> i32
```

##### Params:

$s(t) =$ tick_spacing

##### Formula:

$$t_{max} = log_{\sqrt{1.0001}}(\sqrt{p_{max}}) - log_{\sqrt{1.0001}}(\sqrt{p_{max}})\mod{s(t)}$$

#### Get $min(t)$ based on $s(t)$

Computes the min tick for given tick spacing.

```rust
pub fn get_min_tick(tick_spacing: u16) -> i32
```

##### Params:

$s(t) =$ tick_spacing

##### Formula:

$$t_{min} = log_{\sqrt{1.0001}}(\sqrt{p_{min}}) - s(t) + log_{\sqrt{1.0001}}(\sqrt{p_{min}})\mod{s(t)}$$

#### Conversion from $t$ to $\sqrt{p}$

This function allows to change discrete values from tick ($t$) into more precise price square root ($\sqrt{p}$) values.

```rust
pub fn calculate_price_sqrt(tick_index: i32) -> Price
```

##### Params:

$t =$ tick_index

##### Formula:

$$\sqrt{p} = \sqrt{1.0001^t}$$

#### Calculate $\Delta{x}$

Calculates the token amounts of X needed to change the price between points A and B, corresponding to their respective price roots and the liquidity between these points. The order of prices at points A and B can be ignored since the formula uses absolute values.

```rust
pub fn get_delta_x(
   sqrt_price_a: Price,
   sqrt_price_b: Price,
   liquidity: Liquidity,
   up: bool) -> Option<TokenAmount>
```

##### Params:

$\sqrt{p_a} =$ sqrt_price_a\
$\sqrt{p_b} =$ sqrt_price_b\
$L =$ liquidity

##### Formula:

$$\Delta{x} = \frac {L*| \sqrt{p_a} - \sqrt{p_b} |}  {\sqrt{p_a} * \sqrt{p_b}}$$

#### Calculate $\Delta{y}$

Calculates the token amounts of Y needed to change the price between points A and B, corresponding to their respective price roots and the liquidity between these points. The order of prices at points A and B can be ignored since the formula uses absolute values.

```rust
pub fn get_delta_y(
   sqrt_price_a: Price,
   sqrt_price_b: Price,
   liquidity: Liquidity,
   up: bool) -> Option<TokenAmount>
```

##### Params:

$\sqrt{p_a} =$ sqrt_price_a\
$\sqrt{p_b} =$ sqrt_price_b\
$L =$ liquidity

##### Formula:

$$\Delta{y} = {L*| \sqrt{p_a} - \sqrt{p_b} |}$$

#### Calculate $(\Delta{x}, \Delta{y})$ between $t_l$, and $t_u$

Calculate the required amounts of token X and Y when adding or removing liquidity from the pool within a specified price range and liquidity delta. The price range is determined by lower and upper ticks, and the liquidity direction is indicated by the liquidity sign. Additionally, the token ratio is determined by the current square root of the price.

```rust
pub fn calculate_amount_delta(
   current_sqrt_price: Price,
   liquidity_delta: Liquidity,
   liquidity_sign: bool,
   current_tick_index: i32,
   lower_tick: i32,
   upper_tick: i32,
) -> Result<(TokenAmount, TokenAmount), String>
```

##### Params:

$t_l =$ lower_tick\
$t_u =$ upper_tick\
$t_c =$ current_tick\
$\Delta{L} =$ liquidity_delta\
$\sqrt{p_c} =$ current_sqrt_price\
$\sqrt{p_l} = \sqrt{1.0001^{t_l}}$\
$\sqrt{p_u} = \sqrt{1.0001^{t_u}}$

##### Formula:

$$for \ t_c < t_l< t_u, (\Delta{x},\Delta{y}) = (\Delta{x}(\sqrt{p_l} ,\sqrt{p_u} ,\Delta{L}),0)$$

$$for \ t_l < t_c < t_u, (\Delta{x},\Delta{y}) = (\Delta{x}(\sqrt{p_l} ,\sqrt{p_u} ,\Delta{L}),\Delta{y}(\sqrt{p_l} ,\sqrt{p_u} ,\Delta{L}))$$

$$for \ t_l < t_u ≤ t_c, (\Delta{x},\Delta{y}) = (0,\Delta{y}(\sqrt{p_l} ,\sqrt{p_u} ,\Delta{L}))$$

#### Calculate $(\Delta{L}, \Delta{y})$ given $x$ amount

Calculate the amount of liquidity provided based on the amount of token x provided  based on the current price and the prices of the liquidity range from lower to upper sqrt_price. Additionally returns the amount of token y required for that liquidity change to happen.

```rust
pub fn get_liquidity_by_x_sqrt_price(
   x: TokenAmount,
   lower_sqrt_price: Price,
   upper_sqrt_price: Price,
   current_sqrt_price: Price,
   rounding_up: bool,
) -> TrackableResult<SingleTokenLiquidity>
```
```rust
pub struct SingleTokenLiquidity {
    pub l: Liquidity,
    pub amount: TokenAmount,
}
```

##### Params:
$x =$ x\
$\sqrt{p_c} =$ current_sqrt_price\
$\sqrt{p_l} =$ lower_sqrt_price\
$\sqrt{p_u} =$ upper_sqrt_price

##### Formula:

$$(\Delta{L}, \Delta{y}) = ({x*\frac{\sqrt{p_u} * \sqrt{p_c}} {\sqrt{p_u} - \sqrt{p_c}}, {(\sqrt{p_c} - \sqrt{p_l}) * \Delta L}})$$


#### Calculate $(\Delta{L}, \Delta{x})$ given $y$ amount

Calculate the amount of liquidity provided based on the amount of token y provided the current price and the prices of the liquidity range from lower to upper sqrt_price. Additionally returns the amount of token x required for that liquidity change to happen.

```rust
pub fn get_liquidity_by_y_sqrt_price(
   y: TokenAmount,
   lower_sqrt_price: Price,
   upper_sqrt_price: Price,
   current_sqrt_price: Price,
   rounding_up: bool,
) -> TrackableResult<SingleTokenLiquidity>
```
```rust
pub struct SingleTokenLiquidity {
    pub l: Liquidity,
    pub amount: TokenAmount,
}
```

##### Params:
$y =$ y\
$\sqrt{p_c} =$ current_sqrt_price\
$\sqrt{p_l} =$ lower_sqrt_price\
$\sqrt{p_u} =$ upper_sqrt_price

##### Formula:

$$(\Delta{L}, \Delta{x}) = ({y*\frac 1 {\sqrt{p_c} - \sqrt{p_l}}}, {\frac{\sqrt{p_u} - \sqrt{p_c}} {\sqrt{p_u} * \sqrt{p_c}} * \Delta{L}})$$

#### Calculate Lp token amount from $\Delta{L}$ 

Converts from liquidity delta to the amount of tokens.

```rust
pub fn liquidity_to_lp_token_amount(
   lp_token_supply: TokenAmount,
   current_liquidity: Liquidity,
   liquidity_delta: Liquidity,
   rounding_up: bool,
) -> TrackableResult<TokenAmount>
```

##### Params:

$a_T =$ lp_token_supply\
$L_c =$ current_liquidity\
$\Delta{L} =$ liquidity_delta

##### Formula:
const $a_{OneLP} = 2^{85-64}$ - scale of the LpToken based on $L_{max}$ for full range position ($<2^{85}$) and token precision ($2^{64} - 1 \approx 2^{64}$)

$$for \ L_c = 0, a_{LP} = \Delta{L}/a_{OneLP}$$

$$for \ L_c \ne 0, a_{LP} = \frac {\Delta{L}*a_T} {L_c}$$

#### Calculate $\Delta{L}$ from Lp token amount 

Converts from the amount of tokens to liquidity delta.

```rust
pub fn lp_token_amount_to_liquidity(
   lp_token_supply: TokenAmount,
   current_liquidity: Liquidity,
   lp_token_amount_delta: TokenAmount,
) -> TrackableResult<Liquidity>
```

##### Params:

$a_T =$ lp_token_supply\
$L_c =$ current_liquidity\
$\Delta{a_{LP}} =$ lp_token_amount_delta

##### Formula:
const $a_{OneLP} = 2^{85-64}$ - scale of the LpToken based on $L_{max}$ for full range position ($<2^{85}$) and token precision ($2^{64} - 1 \approx 2^{64}$)

$$for \ a_T = 0, \Delta{L} = a_{LP} * a_{OneLP}$$

$$for \ a_T \ne 0, \Delta{L} = \frac {a_{LP}* L_c} {a_T}$$

#### Get max $\Delta{L}$

Calculates max liquidity achievable given the provided token amounts.

```rust
pub fn get_max_liquidity(
   x: TokenAmount,
   y: TokenAmount,
   lower_tick: i32,
   upper_tick: i32,
   current_sqrt_price: Price,
   rounding_up: bool,
) -> TrackableResult<LiquidityResult> 
```
```rust
pub struct LiquidityResult {
    pub x: TokenAmount,
    pub y: TokenAmount,
    pub l: Liquidity,
}
```

##### Params:

$x =$ x\
$y =$ y\
$t_l =$ lower_tick\
$t_u =$ upper_tick\
$\sqrt{p_c} =$ current_sqrt_price

##### Formula:
$$for \ \Delta{L_x} > \Delta{L_y} \land \Delta{y} \le y, (\Delta{L_{max}}, \Delta{x_{max}}, \Delta{y_{max}}) = (\Delta{L_x}, x, \Delta{y})$$

$$for \ \Delta{L_x} > \Delta{L_y} \land \Delta{y} > y, (\Delta{L_{max}}, \Delta{x_{max}}, \Delta{y_{max}}) = (\Delta{L_y}, \Delta{x}, y)$$

$$for \ \Delta{L_y} > \Delta{L_x} \land \Delta{x} \le  x, (\Delta{L_{max}}, \Delta{x_{max}}, \Delta{y_{max}}) = (\Delta{L_y}, \Delta{x}, y)$$

$$for \ \Delta{L_y} > \Delta{L_x} \land \Delta{x}> x, (\Delta{L_{max}}, \Delta{x_{max}}, \Delta{y_{max}}) = (\Delta{L_x}, x, \Delta{y})$$

#### Compute LpShare change
Computation is performed as follows:
The function evaluates the maximum liquidity achievable given the tokens provided on the full liquidity range (min to max tick for the provided tick spacing).
- Next the amount of tokens is calculated from the liquidity, to get the actual amount that will be used.
 - If the liquidity delta argument is not zero then the amount required to change the position according to the given liquidity delta is computed. Otherwise the function will return early with the position calculated from the initial amounts.
- Any tokens that would not fit into the initial position are returned separately.
- Additionally the amount of Lp tokens to be burned or minted are returned, in case when liquidity is provided tokens are rounded down, if it’s created they’re rounded up.

```rust
fn compute_lp_share_change(
   provide_liquidity: bool,
   lp_token_supply: TokenAmount,
   liquidity_delta: Liquidity,
   x_before: TokenAmount,
   y_before: TokenAmount,
   tick_spacing: u16,
   current_tick_index: i32,
   current_sqrt_price: Price,
) -> TrackableResult<LiquidityChangeResult>
```
```rust
pub struct PositionDetails {
   pub lower_tick: i32,
   pub upper_tick: i32,
   pub liquidity: Liquidity,
}
```
```rust
pub struct LiquidityChangeResult {
   positions_details: PositionDetails,
   transferred_amounts: (TokenAmount, TokenAmount),
   lp_token_change: Option<TokenAmount>,
   leftover_amounts: (TokenAmount, TokenAmount),
}
```

##### Params:

$a_{T} =$ lp_token_supply\
$L =$ liquidity_delta\
$x =$ x_before\
$y =$ y_before\
$s(t) =$ tick_spacing\
$t_c =$ current_tick_index\
$\sqrt{p_c} =$ current_sqrt_price
##### Formula:
$$t_{min} = get\ min\ tick(s(t))$$

$$t_{max} = get\ max\ tick(s(t))$$

$$\Delta{L_{comp}} =\Delta{L_{max}}(x,y,t_{min}, t_{max}, \sqrt{p_c})$$

$$(\Delta{x_{comp}}, \Delta{y_{comp}}) = calculate\ amount\ delta(\Delta{L_{comp}, t_{min}, t_{max}, \sqrt{p_c}, t_{c},})$$

$$for \ provide\ liquidity = true, \Delta{L_{T}} =\Delta{L_{comp}} + \Delta{L}$$

$$for \ provide\ liquidity = false, \Delta{L_{T}} =\Delta{L_{comp}} - \Delta{L}$$

$$(\Delta{x_T}, \Delta{y_T}) = calculate\ amount\ delta(\Delta{L_T, t_{min}, t_{max}, \sqrt{p_c}, t_{c},})$$

$$x_{transferred} = |\Delta{x_T} - \Delta{x_{comp}}|$$

$$y_{transferred} = |\Delta{y_T} - \Delta{y_{comp}}|$$

$$x_{leftover} = |x - \Delta{x_{comp}}|$$

$$y_{leftover} = |y - \Delta{y_{comp}}|$$

$$\Delta{a_{LP}} = liquidity\ to\ lp\ tokens\ amount(a_T, L_{comp}, \Delta{L})$$

$$result = ((t_{min}, t_{max}, \Delta{L_T}), (x_{transferred}, y_{transferred}), \Delta{a_{LP}}, (x_{leftover}, y_{leftover}))$$

### Mint
$\Delta{L} =$ liquidity_delta\
$L_c =$ current_position's liquidity\
$\sqrt{p_c} =$  current sqrt price on the pool\
$t_c =$  current tick on the pool\
$s(t) =$  tick spacing of the pool\
$x_{fee} =$  position fees in token x \
$y_{fee} =$  position fees in token y \
$x_{amount} =$ position amount in token x\
$y_{amount} =$ position amount in token y\
$x_{leftover} =$  lp pool leftovers in token x\
$y_{leftover} =$  lp pool leftovers in token y\
$\Delta{a} =$ liquidity  token amount that will be minted\
$a_T=$ total liquidity  token supply\
$x_{total}=$ $x_{amount}$ + $x_{fee}$ + $x_{leftover}$\
$y_{total}=$ $y_{amount}$ + $y_{fee}$ + $y_{leftover}$\
$t_{min} = get\ min\ tick(s(t))$\
$t_{max} = get\ max\ tick(s(t))$\
$x_{transfer} =$ amount of token x that will be transferred from the user to the contract\
$y_{transfer} =$ amount of token y that will be transferred from the user to the contract
##### Formula:
$$(x_{amount}, x_{fee}, x_{leftover}, y_{amount}, y_{fee}, y_{leftover}, a_T, L_c)$$

$$\downarrow$$

$$Mint(\Delta{L}, x_{total},y_{total},t_c,\sqrt{p_c}, s(t), a_T)$$

$$\downarrow$$

$$(x_{amount}', x_{fee}', x_{leftover}', y_{amount}', y_{fee}', y_{leftover}', a_T', L_c')$$

$\Delta{LpShare} = compute\ lp\ share\ change(true, a_t, x_{total}, y_{total}, t_c, \sqrt{p_c}, s(t))$
$(position, (x_{transfer}, y_{transfer}), \Delta{a}, (x_{leftover}', y_{leftover}')) = \Delta{LpShare}$\
$(t_{min}, t_{max}, L_c') = position$\
$a_T' = a_T + \Delta{a}$\
$(x_{amount}', y_{amount}') = (x_{total} + x_{transfer} - x_{leftover}', y_{total} + y_{transfer} - y_{leftover}')$\
$(x_{fee}', y_{fee}') = (0,0)$

### Burn
$\Delta{L} =$ liquidity_delta\
$L_c =$ current_position's liquidity\
$\sqrt{p_c} =$  current sqrt price on the pool\
$t_c =$  current tick on the pool\
$s(t) =$  tick spacing of the pool\
$x_{fee} =$  position fees in token x \
$y_{fee} =$  position fees in token y \
$x_{amount} =$ position amount in token x\
$y_{amount} =$ position amount in token y\
$x_{leftover} =$  lp pool leftovers in token x\
$y_{leftover} =$  lp pool leftovers in token y\
$\Delta{a} =$ liquidity token amount that will be burned\
$a_T=$ total liquidity token supply\
$x_{total}=$ $x_{amount}$ + $x_{fee}$ + $x_{leftover}$\
$y_{total}=$ $y_{amount}$ + $y_{fee}$ + $y_{leftover}$\
$t_{min} = get\ min\ tick(s(t))$\
$t_{max} = get\ max\ tick(s(t))$\
$x_{transfer} =$ amount of token x that will be transferred from the contract to the user\
$y_{transfer} =$ amount of token y that will be transferred from the contract to the user
##### Formula:
$$(x_{amount}, x_{fee}, x_{leftover}, y_{amount}, y_{fee}, y_{leftover}, a_T, L_c)$$

$$\downarrow$$

$$Burn(\Delta{L}, x_{total},y_{total},t_c,\sqrt{p_c}, s(t), a_T)$$

$$\downarrow$$

$$(x_{amount}', x_{fee}', x_{leftover}', y_{amount}', y_{fee}', y_{leftover}', a_T', L_c')$$

$\Delta{LpShare} = compute\ lp\ share\ change(false, a_t, x_{total}, y_{total}, t_c, \sqrt{p_c}, s(t))$
$(position, (x_{transfer}, y_{transfer}), \Delta{a}, (x_{leftover}', y_{leftover}')) = \Delta{LpShare}$\
$(t_{min}, t_{max}, L_c') = position$\
$a_T' = a_T - \Delta{a}$\
$(x_{amount}', y_{amount}') = (x_{total} - x_{transfer} - x_{leftover}', y_{total} - y_{transfer} - y_{leftover}')$\
$(x_{fee}', y_{fee}') = (0,0)$