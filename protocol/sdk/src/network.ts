export enum Network {
  LOCAL,
  DEV,
  MAIN,
}

export const getProtocolProgramAddress = (network: Network): string => {
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

export const getPuppetProgramAddress = (network: Network): string => {
  switch (network) {
    case Network.LOCAL:
      return "8KQzCc22ZqGLPoipqRhYvkQtHJw6nY1NxrrGy8JLz1jC";
    case Network.DEV:
      return "8KQzCc22ZqGLPoipqRhYvkQtHJw6nY1NxrrGy8JLz1jC";
    case Network.MAIN:
      return "8KQzCc22ZqGLPoipqRhYvkQtHJw6nY1NxrrGy8JLz1jC";
    default:
      throw new Error("Unknown network");
  }
};
