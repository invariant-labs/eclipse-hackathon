export enum Network {
  LOCAL,
  DEV,
  MAIN,
}

export const getProgramAddress = (network: Network): string => {
  switch (network) {
    case Network.LOCAL:
      return "HTBzkQCWc2sbkn5WmLkPmQKKotaeeWgZ3RSD4Eg3f1MS";
    case Network.DEV:
      return "HTBzkQCWc2sbkn5WmLkPmQKKotaeeWgZ3RSD4Eg3f1MS";
    case Network.MAIN:
      return "HTBzkQCWc2sbkn5WmLkPmQKKotaeeWgZ3RSD4Eg3f1MS";
    default:
      throw new Error("Unknown network");
  }
};
