export enum Network {
  LOCAL = 0,
  DEV = 1,
  TEST = 2,
  MAIN = 3,
}

export const getProtocolProgramAddress = (network: Network): string => {
  switch (network) {
    case Network.LOCAL:
      return "GXXm1rzfDiMvgGR92jPAwC48gXxbHCgm87Vjz64kp4Lq";
    case Network.DEV:
      return "GXXm1rzfDiMvgGR92jPAwC48gXxbHCgm87Vjz64kp4Lq";
    case Network.TEST:
      return "GXXm1rzfDiMvgGR92jPAwC48gXxbHCgm87Vjz64kp4Lq";
    case Network.MAIN:
      return "GXXm1rzfDiMvgGR92jPAwC48gXxbHCgm87Vjz64kp4Lq";
    default:
      throw new Error("Unknown network");
  }
};

