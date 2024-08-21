export enum Network {
  LOCAL = 0,
  DEV = 1,
  TEST = 2,
  MAIN = 3,
}

export const getProtocolProgramAddress = (network: Network): string => {
  switch (network) {
    case Network.LOCAL:
      return "HTBzkQCWc2sbkn5WmLkPmQKKotaeeWgZ3RSD4Eg3f1MS";
    case Network.DEV:
      return "HTBzkQCWc2sbkn5WmLkPmQKKotaeeWgZ3RSD4Eg3f1MS";
    case Network.TEST:
      return "HTBzkQCWc2sbkn5WmLkPmQKKotaeeWgZ3RSD4Eg3f1MS";
    case Network.MAIN:
      return "HTBzkQCWc2sbkn5WmLkPmQKKotaeeWgZ3RSD4Eg3f1MS";
    default:
      throw new Error("Unknown network");
  }
};

