import {
  Connection,
  Keypair,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from "@solana/web3.js";
import { getProtocolProgramAddress, Network } from "./network";
import { IWallet } from "./wallet";
import { BN, Program, utils } from "@coral-xyz/anchor";
import { IDL, Protocol as ProtocolProgram } from "./idl/protocol";
import {
  bigNumberToBuffer,
  computeUnitsInstruction,
  signAndSend,
} from "./utils";
import {
  LP_POOL_SEED,
  LP_TOKEN_SEED,
  PROTOCOL_AUTHORITY_SEED,
  PROTOCOL_STATE_SEED,
} from "./consts";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  IDeposit,
  IInitLpPool,
  IInvokeClosePosition,
  IInvokeCreatePosition,
  IInvokeUpdateSecondsPerLiquidity,
  IMint,
  IMintLpToken,
  IReopenPosition,
  ITest,
  IWithdraw,
  LpPoolStructure,
} from "./types";
import {
  getMarketAddress,
  getTokenProgramAddress,
  Market,
  Pair,
} from "@invariant-labs/sdk-eclipse";

export class Protocol {
  public connection: Connection;
  public wallet: IWallet;
  public network: Network;
  public program: Program<ProtocolProgram>;
  public stateAddress: PublicKey;
  public programAuthority: PublicKey;

  private constructor(
    network: Network,
    wallet: IWallet,
    connection: Connection
  ) {
    this.connection = connection;
    this.wallet = wallet;
    this.network = network;
    const programAddress = getProtocolProgramAddress(network);
    this.program = new Program(IDL, programAddress);
    [this.stateAddress] = this.getProtocolStateAddressAndBump();
    [this.programAuthority] = this.getProgramAuthorityAddressAndBump();
  }

  public static async build(
    network: Network,
    wallet: IWallet,
    connection: Connection
  ): Promise<Protocol> {
    const instance = new Protocol(network, wallet, connection);
    return instance;
  }

  getProtocolStateAddressAndBump(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(utils.bytes.utf8.encode(PROTOCOL_STATE_SEED))],
      this.program.programId
    );
  }

  getProgramAuthorityAddressAndBump(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(utils.bytes.utf8.encode(PROTOCOL_AUTHORITY_SEED))],
      this.program.programId
    );
  }

  getLpPoolAddressAndBump(pair: Pair): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(utils.bytes.utf8.encode(LP_POOL_SEED)),
        pair.tokenX.toBuffer(),
        pair.tokenY.toBuffer(),
        bigNumberToBuffer(pair.feeTier.fee, 128),
        bigNumberToBuffer(new BN(pair.feeTier.tickSpacing as number), 16),
      ],
      this.program.programId
    );
  }

  getLpTokenAddressAndBump(pair: Pair): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from(utils.bytes.utf8.encode(LP_TOKEN_SEED)),
        pair.tokenX.toBuffer(),
        pair.tokenY.toBuffer(),
        bigNumberToBuffer(pair.feeTier.fee, 128),
        bigNumberToBuffer(new BN(pair.feeTier.tickSpacing as number), 16),
      ],
      this.program.programId
    );
  }

  getReserveAddress(token: PublicKey): PublicKey {
    return getAssociatedTokenAddressSync(token, this.programAuthority, true);
  }

  async getLpPool(pair: Pair) {
    const [address] = this.getLpPoolAddressAndBump(pair);
    return (await this.program.account.lpPool.fetch(
      address
    )) as LpPoolStructure;
  }

  async sendTx(ix: TransactionInstruction[], signers: Keypair[]) {
    const tx = new Transaction().add(...ix);
    return await signAndSend(tx, signers, this.connection);
  }

  async init(signer: Keypair): Promise<TransactionSignature> {
    const ix = await this.initIx(signer);
    return await this.sendTx([ix], [signer]);
  }
  // TODO: Make this the only init function
  async initWithPositionlist(
    signer: Keypair,
    market: Market
  ): Promise<TransactionSignature> {
    const ix = await this.initIx(signer);

    // TODO: Fix the function in SDK To accept different payer and owner
    const { positionListAddress } = await market.getPositionListAddress(
      this.programAuthority
    );
    const positionListIx = market.program.instruction.createPositionList({
      accounts: {
        positionList: positionListAddress,
        owner: this.programAuthority,
        signer: signer.publicKey,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
      },
    });
    return await this.sendTx([ix, positionListIx], [signer]);
  }

  async initIx(signer?: Keypair): Promise<TransactionInstruction> {
    const [, programAuthorityBump] = this.getProgramAuthorityAddressAndBump();
    const admin = signer?.publicKey ?? this.wallet.publicKey;
    return await this.program.methods
      .init(programAuthorityBump)
      .accounts({
        admin,
        programAuthority: this.programAuthority,
        state: this.stateAddress,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async test(params: ITest, signer: Keypair): Promise<TransactionSignature> {
    const ix = await this.testIx({ ...params }, signer);
    return await this.sendTx([ix], [signer]);
  }

  async testIx(
    { stateBump, ...accounts }: ITest,
    signer?: Keypair
  ): Promise<TransactionInstruction> {
    const payer = signer?.publicKey ?? this.wallet.publicKey;
    return await this.program.methods
      .test(stateBump)
      .accounts({
        systemProgram: SystemProgram.programId,
        payer,
        ...accounts,
      })
      .instruction();
  }

  async mint(params: IMint, signer: Keypair): Promise<TransactionSignature> {
    const ix = await this.mintIx(params);
    return await this.sendTx([ix], [signer]);
  }

  async mintIx({ amount, tokenMint, ...accounts }: IMint): Promise<any> {
    const tokenProgram = await getTokenProgramAddress(
      this.connection,
      tokenMint
    );
    // return await this.program.methods
    //   .mint(amount)
    //   .accounts({
    //     state: this.stateAddress,
    //     programAuthority: this.programAuthority,
    //     tokenMint,
    //     tokenProgram,
    //     ...accounts,
    //   })
    //   .instruction();
  }

  async deposit(
    params: IDeposit,
    signer: Keypair
  ): Promise<TransactionSignature> {
    const ix = await this.depositIx(params, signer);
    return await this.sendTx([ix], [signer]);
  }

  async depositIx(
    { amount, ...accounts }: IDeposit,
    signer?: Keypair
  ): Promise<TransactionInstruction> {
    const owner = signer?.publicKey ?? this.wallet.publicKey;
    return await this.program.methods
      .deposit(amount)
      .accounts({
        state: this.stateAddress,
        programAuthority: this.programAuthority,
        owner,
        tokenProgram: TOKEN_PROGRAM_ID,
        ...accounts,
      })
      .instruction();
  }

  async withdraw(
    params: IWithdraw,
    signer: Keypair
  ): Promise<TransactionSignature> {
    const ix = await this.withdrawIx(params, signer);
    return await this.sendTx([ix], [signer]);
  }

  async withdrawIx(
    { amount, ...accounts }: IWithdraw,
    signer?: Keypair
  ): Promise<TransactionInstruction> {
    const owner = signer?.publicKey ?? this.wallet.publicKey;
    return await this.program.methods
      .withdraw(amount)
      .accounts({
        state: this.stateAddress,
        programAuthority: this.programAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        owner,
        ...accounts,
      })
      .instruction();
  }

  async invokeUpdateSecondsPerLiquidity(
    params: IInvokeUpdateSecondsPerLiquidity,
    signer: Keypair
  ): Promise<TransactionSignature> {
    const ix = await this.invokeUpdateSecondsPerLiquidityIx(params, signer);
    return await this.sendTx([ix], [signer]);
  }

  async invokeUpdateSecondsPerLiquidityIx(
    {
      lowerTickIndex,
      upperTickIndex,
      index,
      ...accounts
    }: IInvokeUpdateSecondsPerLiquidity,
    signer?: Keypair
  ): Promise<TransactionInstruction> {
    const owner = signer?.publicKey ?? this.wallet.publicKey;
    return await this.program.methods
      .invokeUpdateSecondsPerLiquidity(lowerTickIndex, upperTickIndex, index)
      .accounts({
        systemProgram: SystemProgram.programId,
        owner,
        ...accounts,
      })
      .instruction();
  }

  async invokeCreatePosition(
    params: IInvokeCreatePosition,
    signer: Keypair
  ): Promise<TransactionSignature> {
    const ix = await this.invokeCreatePositionIx(params, signer);
    return await this.sendTx([ix], [signer]);
  }

  async invokeCreatePositionIx(
    {
      lowerTickIndex,
      upperTickIndex,
      liquidityDelta,
      slippageLimitLower,
      slippageLimitUpper,
      ...accounts
    }: IInvokeCreatePosition,
    signer?: Keypair
  ): Promise<TransactionInstruction> {
    const owner = signer?.publicKey ?? this.wallet.publicKey;
    return await this.program.methods
      .invokeCreatePosition(
        lowerTickIndex,
        upperTickIndex,
        liquidityDelta,
        slippageLimitLower,
        slippageLimitUpper
      )
      .accounts({
        systemProgram: SystemProgram.programId,
        owner,
        ...accounts,
      })
      .instruction();
  }

  async invokeClosePosition(
    params: IInvokeClosePosition,
    signer: Keypair
  ): Promise<TransactionSignature> {
    const ix = await this.invokeClosePositionIx(params, signer);
    return await this.sendTx([ix], [signer]);
  }

  async invokeClosePositionIx(
    {
      index,
      lowerTickIndex,
      upperTickIndex,
      ...accounts
    }: IInvokeClosePosition,
    signer?: Keypair
  ): Promise<TransactionInstruction> {
    const owner = signer?.publicKey ?? this.wallet.publicKey;
    return await this.program.methods
      .invokeClosePosition(index, lowerTickIndex, upperTickIndex)
      .accounts({ owner, ...accounts })
      .instruction();
  }

  async reopenPosition(
    params: IReopenPosition,
    signer: Keypair
  ): Promise<TransactionSignature> {
    const setCuIx = computeUnitsInstruction(1_400_000);
    const ix = await this.reopenPositionIx(params, signer);
    return await this.sendTx([setCuIx, ix], [signer]);
  }

  async reopenPositionIx(
    { index, ...accounts }: IReopenPosition,
    signer?: Keypair
  ): Promise<TransactionInstruction> {
    const owner = signer?.publicKey ?? this.wallet.publicKey;
    return await this.program.methods
      .reopenPosition(index)
      .accounts({
        systemProgram: SystemProgram.programId,
        owner,
        ...accounts,
      })
      .instruction();
  }

  async initLpPool(params: IInitLpPool, signer: Keypair) {
    const ix = await this.initLpPoolIx(params, signer);
    return await this.sendTx([ix], [signer]);
  }

  async initLpPoolIx(
    { pair, ...accounts }: IInitLpPool,
    signer?: Keypair
  ): Promise<TransactionInstruction> {
    const payer = signer?.publicKey ?? this.wallet.publicKey;

    const [lpPool] = this.getLpPoolAddressAndBump(pair);
    const [tokenLp] = this.getLpTokenAddressAndBump(pair);
    const pool =
      accounts.pool ??
      (await pair.getAddress(new PublicKey(getMarketAddress(this.network))));
    const reserveX = this.getReserveAddress(pair.tokenX);
    const reserveY = this.getReserveAddress(pair.tokenY);
    const tokenXProgram =
      accounts.tokenXProgram ??
      (await getTokenProgramAddress(this.connection, pair.tokenX));
    const tokenYProgram =
      accounts.tokenYProgram ??
      (await getTokenProgramAddress(this.connection, pair.tokenY));

    return await this.program.methods
      .initLpPool()
      .accounts({
        state: this.stateAddress,
        programAuthority: this.programAuthority,
        lpPool,
        tokenLp,
        payer,
        pool,
        tokenX: pair.tokenX,
        tokenY: pair.tokenY,
        reserveX,
        reserveY,
        tokenXProgram,
        tokenYProgram,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        ...accounts,
      })
      .instruction();
  }

  async mintLpToken(params: IMintLpToken, signer: Keypair) {
    const ix = await this.mintLpTokenIx(params, signer);
    return await this.sendTx([ix], [signer]);
  }

  async mintLpTokenIx(
    { pair, liquidityDelta, index, ...accounts }: IMintLpToken,
    signer?: Keypair
  ) {
    const owner = signer?.publicKey ?? this.wallet.publicKey;

    const [lpPool] = this.getLpPoolAddressAndBump(pair);
    const [tokenLp] = this.getLpTokenAddressAndBump(pair);
    const pool =
      accounts.pool ??
      (await pair.getAddress(new PublicKey(getMarketAddress(this.network))));
    const reserveX = this.getReserveAddress(pair.tokenX);
    const reserveY = this.getReserveAddress(pair.tokenY);
    const tokenXProgram =
      accounts.tokenXProgram ??
      (await getTokenProgramAddress(this.connection, pair.tokenX));
    const tokenYProgram =
      accounts.tokenYProgram ??
      (await getTokenProgramAddress(this.connection, pair.tokenY));
    const accountLp = getAssociatedTokenAddressSync(
      tokenLp,
      owner,
      undefined,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    return await this.program.methods
      .mintLpToken(liquidityDelta, index)
      .accounts({
        state: this.stateAddress,
        programAuthority: this.programAuthority,
        lpPool,
        tokenLp,
        accountLp,
        owner,
        pool,
        tokenX: pair.tokenX,
        tokenY: pair.tokenY,
        reserveX,
        reserveY,
        tokenXProgram,
        tokenYProgram,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        ...accounts,
      })
      .instruction();
  }
}
