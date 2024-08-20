export const PROTOCOL_STATE_SEED = "PROTOCOLState";
export const PROTOCOL_AUTHORITY_SEED = "PROTOCOLAuthority";
export const PUPPET_COUNTER_SEED = "PUPPETCounter";
export const LP_POOL_SEED = "poolv1";
export const LP_TOKEN_SEED = "lp_tokenv1";

const LOG2_MAX_FULL_RANGE_LIQUIDITY = 85;
const LOG2_MAX_TOKEN_ACCURACY = 64;
export const ONE_LP_TOKEN =
  2 ** (LOG2_MAX_FULL_RANGE_LIQUIDITY - LOG2_MAX_TOKEN_ACCURACY);
