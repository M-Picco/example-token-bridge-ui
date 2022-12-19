import { CHAIN_ID_SOLANA } from "@certusone/wormhole-sdk";
import { Adapter, WalletAdapterNetwork, WalletName, WalletReadyState } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider, useWallet, WalletContextState, WalletProvider
} from "@solana/wallet-adapter-react";
import {
  BackpackWalletAdapter, BloctoWalletAdapter, CloverWalletAdapter,
  Coin98WalletAdapter, ExodusWalletAdapter, NightlyWalletAdapter, PhantomWalletAdapter, SlopeWalletAdapter, SolflareWalletAdapter, SolletExtensionWalletAdapter, SolletWalletAdapter, SolongWalletAdapter,
  TorusWalletAdapter
} from "@solana/wallet-adapter-wallets";
import { PublicKey } from "@solana/web3.js";
import { FC, useCallback, useEffect, useMemo } from "react";
import { SolanaWallet } from "wormhole-wallet-aggregator";
import { useChangeWallet, useUnsetWalletFromChain, useWalletFromChain, useWalletsForChain } from "wormhole-wallet-aggregator-react";
import { CLUSTER, SOLANA_HOST } from "../utils/consts";

export const SolanaWalletProvider: FC = (props) => {
  const wallets = useMemo(() => {
    const wallets: Adapter[] = [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BackpackWalletAdapter(),
      new NightlyWalletAdapter(),
      new SolletWalletAdapter(),
      new SolletExtensionWalletAdapter(),
      new CloverWalletAdapter(),
      new Coin98WalletAdapter(),
      new SlopeWalletAdapter(),
      new SolongWalletAdapter(),
      new TorusWalletAdapter(),
      new ExodusWalletAdapter(),
    ];
    if (CLUSTER === "testnet") {
      wallets.push(
        new BloctoWalletAdapter({ network: WalletAdapterNetwork.Devnet })
      );
    }
    return wallets;
  }, []);

  return (
    <ConnectionProvider endpoint={SOLANA_HOST}>
      <WalletProvider wallets={wallets} autoConnect>
        {props.children}
      </WalletProvider>
    </ConnectionProvider>
  );
};

// export const useSolanaWallet = useWallet;
export const useSolanaWallet = (): WalletContextState => {
  const changeWallet = useChangeWallet();
  const unsetWalletFromChain = useUnsetWalletFromChain();
  const wallet = useWalletFromChain(CHAIN_ID_SOLANA);
  const wallets = useWalletsForChain(CHAIN_ID_SOLANA);

  const publicKey = useMemo(() => {
    const pk = wallet?.getPublicKey();
    return pk ? new PublicKey(pk) : null;
  }, [ wallet ]);

  const connected = useMemo(() => publicKey !== null, [publicKey]);

  const connect = useCallback(() => { if (!wallet) throw new Error('No solana wallet'); return wallet!.connect() }, [ wallet ]);
  const signTransaction = useCallback((tx: any) => { if (!wallet) throw new Error('No solana wallet'); return wallet!.signTransaction(tx) }, [ wallet ]);
  const signAllTransactions = useCallback((tx: any) => { if (!wallet) throw new Error('No solana wallet'); return wallet!.signTransaction(tx) }, [ wallet ]);
  const sendTransaction = useCallback((tx: any) => { if (!wallet) throw new Error('No solana wallet'); return wallet!.sendTransaction(tx) }, [ wallet ]);
  const signMessage = useCallback((msg: Uint8Array) => { if (!wallet) throw new Error('No solana wallet'); return wallet!.signMessage(msg) }, [ wallet ]);
  const disconnect = useCallback(async () => {
    await wallet!.disconnect();
    unsetWalletFromChain(CHAIN_ID_SOLANA);
  }, [ wallet, unsetWalletFromChain ]);

  const select = useCallback(async (walletName: WalletName) => {
    const selectedWallet = wallets.find(w => w.getName() === walletName);
    if (!selectedWallet) throw new Error(`Wallet ${walletName} does not exist`);
    await selectedWallet.connect();
    changeWallet(selectedWallet);
  }, [ wallets, changeWallet ])

  const walletMemo = useMemo(() => {
    return wallet ? ({
      adapter: (wallet as SolanaWallet).getAdapter() as Adapter,
      readyState: WalletReadyState.Installed
    }) : null;
  }, [ wallet ]);

  const walletsMemo = useMemo(() => {
    return (wallets as SolanaWallet[])
      .map(w => ({
        adapter: w.getAdapter() as Adapter,
        readyState: WalletReadyState.Installed
      }))
  }, [ wallets ]);

  return useMemo(() => ({
    connect,
    disconnect,
    autoConnect: false,
    connecting: false,
    connected,
    publicKey,
    disconnecting: false,
    select,
    signTransaction,
    signAllTransactions,
    sendTransaction,
    signMessage,
    wallet: walletMemo,
    wallets: walletsMemo
  }), [ walletMemo, walletsMemo, connected, publicKey, select, disconnect,
    connect, signTransaction, signAllTransactions, sendTransaction, signMessage
  ]);
};
