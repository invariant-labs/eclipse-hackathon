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
import { AnchorProvider, BN, Program, utils } from "@coral-xyz/anchor";
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
  IReopenPosition,
  ITest,
  IWithdraw,
  LpPoolStructure,
} from "./types";
import {
  getMarketAddress,
  getTokenProgramAddress,
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
    const provider = new AnchorProvider(
      connection,
      wallet,
      AnchorProvider.defaultOptions()
    );
    this.program = new Program(IDL, programAddress, provider);
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

  async mintIx({
    amount,
    tokenMint,
    ...accounts
  }: IMint): Promise<TransactionInstruction> {
    const tokenProgram = await getTokenProgramAddress(
      this.connection,
      tokenMint
    );
    return await this.program.methods
      .mint(amount)
      .accounts({
        state: this.stateAddress,
        programAuthority: this.programAuthority,
        tokenMint,
        tokenProgram,
        ...accounts,
      })
      .instruction();
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

  async initLpPool(accounts: IInitLpPool, signer: Keypair) {
    const ix = await this.initLpPoolIx(accounts, signer);
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
}
