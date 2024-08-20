import { BN } from "@coral-xyz/anchor";
import { calculatePriceSqrt } from "@invariant-labs/sdk-eclipse";
import { Decimal, PoolStructure } from "@invariant-labs/sdk-eclipse/lib/market";
import {
  getDeltaX,
  getDeltaY,
  getLiquidityByXPrice,
  getLiquidityByYPrice,
  MAX_TICK,
} from "@invariant-labs/sdk-eclipse/lib/math";
import { getMaxTick, getMinTick } from "@invariant-labs/sdk-eclipse/lib/utils";
import { ONE_LP_TOKEN } from "./consts";

export const getLiquidityByXInFullRange = (
  x: BN,
  currentSqrtPrice: Decimal,
  roundingUp: boolean,
  tickSpacing: number
): { liquidity: Decimal; y: BN } => {
  const lowerTickIndex = getMinTick(tickSpacing);
  const upperTickIndex = -lowerTickIndex;

  const lowerSqrtPrice = calculatePriceSqrt(lowerTickIndex);
  const upperSqrtPrice = calculatePriceSqrt(upperTickIndex);

  return getLiquidityByXPrice(
    x,
    lowerSqrtPrice,
    upperSqrtPrice,
    currentSqrtPrice,
    roundingUp
  );
};

export const getLiquidityByYInFullRange = (
  y: BN,
  currentSqrtPrice: Decimal,
  roundingUp: boolean,
  tickSpacing: number
): { liquidity: Decimal; x: BN } => {
  const lowerTickIndex = getMinTick(tickSpacing);
  const upperTickIndex = -lowerTickIndex;

  const lowerSqrtPrice = calculatePriceSqrt(lowerTickIndex);
  const upperSqrtPrice = calculatePriceSqrt(upperTickIndex);

  return getLiquidityByYPrice(
    y,
    lowerSqrtPrice,
    upperSqrtPrice,
    currentSqrtPrice,
    roundingUp
  );
};

export const calculateAmountDelta = (
  currentSqrtPrice: Decimal,
  liquidityDelta: Decimal,
  liquiditySign: boolean,
  currentTickIndex: number,
  lowerTick: number,
  upperTick: number
): { x: Decimal; y: Decimal } => {
  let amountX = new BN(0);
  let amountY = new BN(0);

  if (currentTickIndex < lowerTick) {
    amountX = getDeltaX(
      calculatePriceSqrt(lowerTick),
      calculatePriceSqrt(upperTick),
      liquidityDelta,
      liquiditySign
    );
  } else if (currentTickIndex < upperTick) {
    amountX = getDeltaX(
      currentSqrtPrice,
      calculatePriceSqrt(upperTick),
      liquidityDelta,
      liquiditySign
    );
    amountY = getDeltaY(
      calculatePriceSqrt(lowerTick),
      currentSqrtPrice,
      liquidityDelta,
      liquiditySign
    );
  } else {
    amountY = getDeltaY(
      calculatePriceSqrt(lowerTick),
      calculatePriceSqrt(upperTick),
      liquidityDelta,
      liquiditySign
    );
  }

  return { x: { v: amountX }, y: { v: amountY } };
};

export const getMaxLiquidity = (
  x: Decimal,
  y: Decimal,
  lowerTick: number,
  upperTick: number,
  currentSqrtPrice: Decimal,
  roundingUp: boolean
): { x: Decimal; y: Decimal; liquidity: Decimal } => {
  if (lowerTick < -MAX_TICK || upperTick > MAX_TICK) {
    throw new Error("Invalid Ticks");
  }

  if (lowerTick >= upperTick) {
    throw new Error("lower tick >= upper tick");
  }

  const lowerSqrtPrice = calculatePriceSqrt(lowerTick);
  const upperSqrtPrice = calculatePriceSqrt(upperTick);

  const resultByY = getLiquidityByYPrice(
    y.v,
    lowerSqrtPrice,
    upperSqrtPrice,
    currentSqrtPrice,
    roundingUp
  );
  const resultByX = getLiquidityByXPrice(
    x.v,
    lowerSqrtPrice,
    upperSqrtPrice,
    currentSqrtPrice,
    roundingUp
  );

  if (resultByX.liquidity.v.gt(resultByY.liquidity.v)) {
    if (resultByX.y.lte(y.v)) {
      return {
        x,
        y: { v: resultByX.y },
        liquidity: resultByX.liquidity,
      };
    } else {
      return {
        x: { v: resultByY.x },
        y,
        liquidity: resultByY.liquidity,
      };
    }
  } else {
    if (resultByY.x.lte(x.v)) {
      return {
        x: { v: resultByY.x },
        y,
        liquidity: resultByY.liquidity,
      };
    } else {
      return {
        x,
        y: { v: resultByX.y },
        liquidity: resultByX.liquidity,
      };
    }
  }
};

export const computeMaxLiquidityPosition = (
  xBefore: Decimal,
  yBefore: Decimal,
  minTick: number,
  maxTick: number,
  currentTickIndex: number,
  currentSqrtPrice: Decimal
): { amountX: Decimal; amountY: Decimal; currentLiquidity: Decimal } => {
  const currentLiquidity = getMaxLiquidity(
    xBefore,
    yBefore,
    minTick,
    maxTick,
    currentSqrtPrice,
    true
  );

  const oldPositionAmounts = calculateAmountDelta(
    currentSqrtPrice,
    currentLiquidity.liquidity,
    true,
    currentTickIndex,
    minTick,
    maxTick
  );

  return {
    amountX: oldPositionAmounts.x,
    amountY: oldPositionAmounts.y,
    currentLiquidity: currentLiquidity.liquidity,
  };
};

export const liquidityToLpTokenAmount = (
  lpTokenSupply: Decimal,
  currentLiquidity: Decimal,
  liquidityDelta: Decimal,
  roundingUp: boolean
): Decimal => {
  if (currentLiquidity.v.eq(new BN(0))) {
    return { v: liquidityDelta.v.divn(ONE_LP_TOKEN) };
  }

  if (roundingUp) {
    return liquidityDelta.v
      .mul(lpTokenSupply.v)
      .add(currentLiquidity.v)
      .div(currentLiquidity.v);
  }

  return { v: liquidityDelta.v.mul(lpTokenSupply.v).div(currentLiquidity.v) };
};

export const computeLpShareChange = (
  provideLiquidity: boolean,
  lpTokenSupply: Decimal,
  liquidityDelta: Decimal,
  xBefore: Decimal,
  yBefore: Decimal,
  tickSpacing: number,
  currentTickIndex: number,
  currentSqrtPrice: Decimal
): {
  positionDetails: {
    lowerTick: number;
    upperTick: number;
    liquidity: Decimal;
  };
  lpTokenChange: Decimal | null;
  transferredAmounts: [Decimal, Decimal];
  leftoverAmounts: [Decimal, Decimal];
} => {
  const maxTick = getMaxTick(tickSpacing);
  const minTick = -maxTick;
  const {
    amountX: oldX,
    amountY: oldY,
    currentLiquidity,
  } = computeMaxLiquidityPosition(
    xBefore,
    yBefore,
    minTick,
    maxTick,
    currentTickIndex,
    currentSqrtPrice
  );

  let leftoverX = xBefore.v.sub(oldX.v);
  let leftoverY = yBefore.v.sub(oldY.v);

  if (liquidityDelta.v.eq(new BN(0))) {
    return {
      positionDetails: {
        lowerTick: minTick,
        upperTick: maxTick,
        liquidity: { v: currentLiquidity },
      },
      lpTokenChange: null,
      transferredAmounts: [{ v: 0 }, { v: 0 }],
      leftoverAmounts: [{ v: leftoverX }, { v: leftoverY }],
    };
  }

  let newLiquidity = null;
  if (provideLiquidity) {
    newLiquidity = currentLiquidity.v.add(liquidityDelta.v);
  } else {
    newLiquidity = currentLiquidity.v.sub(liquidityDelta.v);
  }

  const newPositionAmounts = calculateAmountDelta(
    currentSqrtPrice,
    { v: newLiquidity },
    true,
    currentTickIndex,
    minTick,
    maxTick
  );

  const [transferredX, transferredY] = provideLiquidity
    ? [newPositionAmounts.x.v.sub(oldX.v), newPositionAmounts.y.v.sub(oldY.v)]
    : [oldX.v.sub(newPositionAmounts.x.v), oldY.v.sub(newPositionAmounts.y.v)];

  if (transferredX.eq(new BN(0)) && transferredY.eq(new BN(0))) {
    throw new Error("Liquidity delta too small to create a deposit");
  }

  const lpTokenChange = liquidityToLpTokenAmount(
    lpTokenSupply,
    currentLiquidity,
    liquidityDelta,
    !provideLiquidity
  );

  if (lpTokenChange.v.eq(new BN(0))) {
    throw new Error("Liquidity delta too small to change LpToken amount");
  }

  return {
    positionDetails: {
      lowerTick: minTick,
      upperTick: maxTick,
      liquidity: { v: newLiquidity },
    },
    lpTokenChange,
    transferredAmounts: [{ v: transferredX }, { v: transferredY }],
    leftoverAmounts: [{ v: leftoverX }, { v: leftoverY }],
  };
};
