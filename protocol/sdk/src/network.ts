export enum Network {
  LOCAL = 0,
  DEV = 1,
  TEST = 2,
  MAIN = 3,
}

export const getProtocolProgramAddress = (network: Network): string => {
  switch (network) {
    case Network.LOCAL:
      return "FE56ivh6V5JXW9nGuRV6DCWccXntLX8h4gtCqeJDwLZ8";
    case Network.DEV:
      return "FE56ivh6V5JXW9nGuRV6DCWccXntLX8h4gtCqeJDwLZ8";
    case Network.TEST:
      return "FE56ivh6V5JXW9nGuRV6DCWccXntLX8h4gtCqeJDwLZ8";
    case Network.MAIN:
      return "FE56ivh6V5JXW9nGuRV6DCWccXntLX8h4gtCqeJDwLZ8";
    default:
      throw new Error("Unknown network");
  }
};
