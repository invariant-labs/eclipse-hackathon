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
import { BN, MethodsNamespace, Program, utils } from "@coral-xyz/anchor";
import { IDL, Protocol as ProtocolProgram } from "./idl/protocol";
import {
  DepositParams,
  InitParams,
  invokeCreatePosition,
  InvokeClosePositionAccounts,
  InvokeUpdateSecondsPerLiquidityParams,
  ITransaction,
  MintParams,
  TestParams,
  WithdrawParams,
  InvokeCreatePositionParams,
  InvokeClosePositionParams,
} from "./types";
import { signAndSend } from "./utils";
import { PROTOCOL_AUTHORITY_SEED, PROTOCOL_STATE_SEED } from "./consts";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Decimal } from "@invariant-labs/sdk-eclipse/lib/market";
import { MethodsFn } from "@coral-xyz/anchor/dist/cjs/program/namespace/types";

export class Protocol {
  public connection: Connection;
  public wallet: IWallet;
  public network: Network;
  public program: Program<ProtocolProgram>;
  public stateAddressAndBump: [PublicKey, number];
  public programAuthorityAddressAndBump: [PublicKey, number];

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
    this.stateAddressAndBump = PublicKey.findProgramAddressSync(
      [Buffer.from(utils.bytes.utf8.encode(PROTOCOL_STATE_SEED))],
      this.program.programId
    );
    this.programAuthorityAddressAndBump = PublicKey.findProgramAddressSync(
      [Buffer.from(utils.bytes.utf8.encode(PROTOCOL_AUTHORITY_SEED))],
      this.program.programId
    );
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
    return this.stateAddressAndBump;
  }

  getProtocolStateAddress(): PublicKey {
    return this.stateAddressAndBump[0];
  }

  getProgramAuthorityAddressAndBump(): [PublicKey, number] {
    return this.programAuthorityAddressAndBump;
  }

  getProgramAuthorityAddress() {
    return this.programAuthorityAddressAndBump[0];
  }

  async sendTx(ix: TransactionInstruction[], signers: Keypair[]) {
    const tx = new Transaction().add(...ix);
    return await signAndSend(tx, signers, this.connection);
  }

  async init(params: InitParams): Promise<TransactionSignature> {
    const ix = await this.initIx(params);
    return await this.sendTx([ix], [params.signer]);
  }

  async initIx({ signer }: InitParams): Promise<TransactionInstruction> {
    const [programAuthority, programAuthorityBump] =
      this.getProgramAuthorityAddressAndBump();
    const [state] = this.getProtocolStateAddressAndBump();

    return await this.program.methods
      .init(programAuthorityBump)
      .accounts({
        admin: signer.publicKey,
        programAuthority,
        state,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
      })
      .instruction();
  }

  async test(params: TestParams): Promise<TransactionSignature> {
    const ix = await this.testIx(params);
    return await this.sendTx([ix], [params.signer]);
  }

  async testIx({
    stateBump,
    signer,
    puppetProgram,
    counter,
  }: TestParams): Promise<TransactionInstruction> {
    return await this.program.methods
      .test(stateBump)
      .accounts({
        payer: signer.publicKey,
        systemProgram: SystemProgram.programId,
        puppetProgram,
        counter,
      })
      .instruction();
  }

  async mint(params: MintParams): Promise<TransactionSignature> {
    const ix = await this.mintIx(params);
    return await this.sendTx([ix], [params.signer]);
  }

  async mintIx({
    amount,
    tokenMint,
    to,
  }: MintParams): Promise<TransactionInstruction> {
    const state = this.getProtocolStateAddress();
    const [programAuthority] = this.getProgramAuthorityAddressAndBump();

    return await this.program.methods
      .mint(amount)
      .accounts({
        state,
        programAuthority,
        tokenMint,
        to,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  async deposit(params: DepositParams): Promise<TransactionSignature> {
    const ix = await this.depositIx(params);
    return await this.sendTx([ix], [params.payer]);
  }

  async depositIx({
    amount,
    tokenMint,
    reserve,
    userBalance,
    payer,
  }: DepositParams): Promise<TransactionInstruction> {
    const state = this.getProtocolStateAddress();
    const [programAuthority] = this.getProgramAuthorityAddressAndBump();

    return await this.program.methods
      .deposit(amount)
      .accounts({
        state,
        programAuthority,
        tokenMint,
        reserve,
        userBalance,
        owner: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  async withdraw(params: WithdrawParams): Promise<TransactionSignature> {
    const ix = await this.withdrawIx(params);
    return await this.sendTx([ix], [params.payer]);
  }

  async withdrawIx({
    amount,
    tokenMint,
    reserve,
    userBalance,
    payer,
  }: WithdrawParams): Promise<TransactionInstruction> {
    const state = this.getProtocolStateAddress();
    const [programAuthority] = this.getProgramAuthorityAddressAndBump();

    return await this.program.methods
      .withdraw(amount)
      .accounts({
        state,
        programAuthority,
        tokenMint,
        reserve,
        userBalance,
        owner: payer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .instruction();
  }

  async invokeUpdateSecondsPerLiquidity(
    params: InvokeUpdateSecondsPerLiquidityParams
  ): Promise<TransactionSignature> {
    const ix = await this.invokeUpdateSecondsPerLiquidityIx(params);
    return await this.sendTx([ix], [params.signer]);
  }

  async invokeUpdateSecondsPerLiquidityIx({
    lowerTickIndex,
    upperTickIndex,
    index,
    signer,
    ...accounts
  }: InvokeUpdateSecondsPerLiquidityParams): Promise<TransactionInstruction> {
    return await this.program.methods
      .invokeUpdateSecondsPerLiquidity(lowerTickIndex, upperTickIndex, index)
      .accounts({
        signer: signer.publicKey,
        systemProgram: SystemProgram.programId,
        ...accounts,
      })
      .instruction();
  }

  async invokeCreatePosition(
    params: InvokeCreatePositionParams
  ): Promise<TransactionSignature> {
    const ix = await this.invokeCreatePositionIx(params);
    return await this.sendTx([ix], [params.signer]);
  }

  async invokeCreatePositionIx({
    lowerTickIndex,
    upperTickIndex,
    liquidityDelta,
    slippageLimitLower,
    slippageLimitUpper,
    signer,
    ...accounts
  }: InvokeCreatePositionParams): Promise<TransactionInstruction> {
    return await this.program.methods
      .invokeCreatePosition(
        lowerTickIndex,
        upperTickIndex,
        liquidityDelta,
        slippageLimitLower,
        slippageLimitUpper
      )
      .accounts({
        signer: signer.publicKey,
        systemProgram: SystemProgram.programId,
        ...accounts,
      })
      .instruction();
  }

  async invokeClosePosition(
    params: InvokeClosePositionParams
  ): Promise<TransactionSignature> {
    const ix = await this.invokeClosePositionIx(params);

    return await this.sendTx([ix], [params.signer]);
  }

  async invokeClosePositionIx({
    index,
    lowerTickIndex,
    upperTickIndex,
    ...accounts
  }: InvokeClosePositionParams): Promise<TransactionInstruction> {
    return await this.program.methods
      .invokeClosePosition(index, lowerTickIndex, upperTickIndex)
      .accounts(accounts)
      .instruction();
  }
}
