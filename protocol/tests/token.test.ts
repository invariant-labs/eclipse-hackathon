import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { Network } from "../sdk/src/network";
import { Protocol } from "../sdk/src/protocol";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createTokenMint, sleep } from "./test-utils";
import { getProgramAuthorityAddressAndBump } from "../sdk/src/utils";
import { assert } from "chai";
import {
  getAccount,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

describe("token", () => {
  const { wallet, connection } = AnchorProvider.local();
  const owner: Keypair = Keypair.generate();
  const payer = Keypair.generate();

  let protocol: Protocol;
  let lpTokenMinter: PublicKey;

  const tokenAmount = 100n;
  const tokenDecimals = 6;
  const mintAmount = new BN(tokenAmount * 10n ** BigInt(tokenDecimals));
  const depositAmount = mintAmount.div(new BN(4));
  const withdrawAmount = depositAmount.div(new BN(5));

  before(async () => {
    await Promise.all([
      connection.requestAirdrop(owner.publicKey, 1e14),
      await connection.requestAirdrop(payer.publicKey, 1e9),
    ]);
    await sleep(10000);

    protocol = await Protocol.build(Network.LOCAL, wallet, connection);
    await protocol.init(owner);

    const [mintAuthority] = getProgramAuthorityAddressAndBump(
      protocol.program.programId
    );

    lpTokenMinter = await createTokenMint(
      connection,
      payer,
      mintAuthority,
      tokenDecimals
    );
  });

  it("mint", async () => {
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
  it("deposit", async () => {
    const [programAuthority] = getProgramAuthorityAddressAndBump(
      protocol.program.programId
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
      assert.equal(lpTokenAccountInfo.amount, mintAmount);
    }

    const lpTokenReserve = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      lpTokenMinter,
      programAuthority,
      true
    );

    await protocol.deposit(
      lpTokenMinter,
      lpTokenReserve.address,
      lpTokenAccount.address,
      depositAmount,
      payer
    );
    {
      const lpTokenAccountInfo = await getAccount(
        connection,
        lpTokenAccount.address
      );
      const lpTokenReserveInfo = await getAccount(
        connection,
        lpTokenReserve.address
      );

      assert.equal(lpTokenAccountInfo.amount, mintAmount.sub(depositAmount));
      assert.equal(lpTokenReserveInfo.amount, depositAmount);
    }
  });
  it("withdraw", async () => {
    const [programAuthority] = getProgramAuthorityAddressAndBump(
      protocol.program.programId
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
      assert.equal(lpTokenAccountInfo.amount, mintAmount.sub(depositAmount));
    }

    const lpTokenReserve = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      lpTokenMinter,
      programAuthority,
      true
    );

    await protocol.withdraw(
      lpTokenMinter,
      lpTokenReserve.address,
      lpTokenAccount.address,
      withdrawAmount,
      payer
    );
    {
      const lpTokenAccountInfo = await getAccount(
        connection,
        lpTokenAccount.address
      );
      const lpTokenReserveInfo = await getAccount(
        connection,
        lpTokenReserve.address
      );

      assert.equal(
        lpTokenAccountInfo.amount,
        mintAmount.sub(depositAmount).add(withdrawAmount)
      );
      assert.equal(
        lpTokenReserveInfo.amount,
        depositAmount.sub(withdrawAmount)
      );
    }
  });
});
