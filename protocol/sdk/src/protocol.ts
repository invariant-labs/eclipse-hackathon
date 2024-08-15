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
import { Program, utils } from "@coral-xyz/anchor";
import { IDL, Protocol as ProtocolProgram } from "./idl/protocol";
import { computeUnitsInstruction, signAndSend } from "./utils";
import { PROTOCOL_AUTHORITY_SEED, PROTOCOL_STATE_SEED } from "./consts";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
  IDeposit,
  IInvokeClosePosition,
  IInvokeCreatePosition,
  IInvokeUpdateSecondsPerLiquidity,
  IMint,
  IReopenPosition,
  ITest,
  IWithdraw,
} from "./types";

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
    ...accounts
  }: IMint): Promise<TransactionInstruction> {
    return await this.program.methods
      .mint(amount)
      .accounts({
        state: this.stateAddress,
        programAuthority: this.programAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
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
}
