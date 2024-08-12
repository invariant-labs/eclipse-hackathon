import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair } from "@solana/web3.js";
import { createTokenMint, sleep } from "./test-utils";
import { Puppet } from "../sdk/dist/puppet";
import {
  getProgramAuthorityAddressAndBump,
  getPuppetCounterAddressAndBump,
} from "../sdk/src/utils";
import { assert } from "chai";
import {
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

describe("init", () => {
  const { wallet, connection } = AnchorProvider.local();
  const owner: Keypair = Keypair.generate();

  before(async () => {
    await Promise.all([connection.requestAirdrop(owner.publicKey, 1e14)]);
    await sleep(1000);
  });

  it("init works", async () => {
    const protocol = await Protocol.build(Network.LOCAL, wallet, connection);

    await protocol.init(owner);
  });

  it("cpi works", async () => {
    const protocol = await Protocol.build(Network.LOCAL, wallet, connection);
    const puppet = await Puppet.build(Network.LOCAL, wallet, connection);

    const [puppetCounterAddress, bump] = getPuppetCounterAddressAndBump(
      puppet.program.programId
    );

    await protocol.test(
      {
        puppetProgram: puppet.program.programId,
        counter: puppetCounterAddress,
      },
      bump,
      owner
    );

    const stateAccount = await puppet.program.account.counter.fetch(
      puppetCounterAddress
    );
    assert.equal(stateAccount.owner?.toString(), owner.publicKey.toString());
    assert.equal(stateAccount.counter, 0);
    assert.equal(stateAccount.bump, bump);
  });

  it("mint works", async () => {
    const protocol = await Protocol.build(Network.LOCAL, wallet, connection);
    protocol.init(owner);

    const [mintAuthority] = getProgramAuthorityAddressAndBump(
      protocol.program.programId
    );
    const tokenAmount = 100n;
    const tokenDecimals = 6;
    const mintAmount = new BN(tokenAmount * 10n ** BigInt(tokenDecimals));

    const payer = Keypair.generate();
    await connection.requestAirdrop(payer.publicKey, 1e9);
    await sleep(1000);

    const lpTokenMinter = await createTokenMint(
      connection,
      payer,
      mintAuthority,
      tokenDecimals
    );
    const lpTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      lpTokenMinter,
      payer.publicKey
    );

    {
      const lpTokenAccountInfo = await getAccount(
        connection,
        lpTokenAccount.address
      );
      assert.equal(lpTokenAccountInfo.amount, 0n);
    }

    await protocol.mint(
      lpTokenMinter,
      lpTokenAccount.address,
      mintAmount,
      payer
    );

    {
      const lpTokenAccountInfo = await getAccount(
        connection,
        lpTokenAccount.address
      );
      assert.equal(lpTokenAccountInfo.amount, mintAmount);
    }
  });
});
