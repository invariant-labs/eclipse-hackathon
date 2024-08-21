import { AnchorProvider } from "@coral-xyz/anchor";
import { Protocol } from "../sdk/src";
import { Market, Network, Pair } from "@invariant-labs/sdk-eclipse";
import { MINTER } from "./minter";
import { PublicKey } from "@solana/web3.js";
import { FEE_TIERS } from "@invariant-labs/sdk-eclipse/lib/utils";

require("dotenv").config();

const TESTNET_RPC = "https://testnet.dev2.eclipsenetwork.xyz";
const provider = AnchorProvider.local(TESTNET_RPC, {
  skipPreflight: true,
});

const connection = provider.connection;

const main = async () => {
  const protocol = await Protocol.build(
    Network.TEST,
    provider.wallet,
    connection
  );
//   const market = await Market.build(Network.TEST, provider.wallet, connection);
//   await protocol.initWithPositionlist(MINTER, market);

  const pair = new Pair(
    new PublicKey("2F5TprcNBqj2hXVr9oTssabKdf8Zbsf9xStqWjPm8yLo"),
    new PublicKey("5gFSyxjNsuQsZKn9g5L9Ky3cSUvJ6YXqWVuPzmSi8Trx"),
    FEE_TIERS[2]
  );

  await protocol.initLpPool({ pair }, MINTER);
};

main();