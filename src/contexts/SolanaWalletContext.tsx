import { CHAIN_ID_SOLANA } from "@certusone/wormhole-sdk";
import { Adapter, WalletName, WalletReadyState } from "@solana/wallet-adapter-base";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useCallback, useMemo } from "react";
import { useChangeWallet, useUnsetWalletFromChain, useWalletFromChain, useWalletsForChain } from "wallet-aggregator-react";
import { SolanaWallet } from "wallet-aggregator-solana";

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
      readyState: WalletReadyState[wallet.getWalletState()]
    }) : null;
  }, [ wallet ]);

  const walletsMemo = useMemo(() => {
    return (wallets as SolanaWallet[])
      .map(w => ({
        adapter: w.getAdapter() as Adapter,
        readyState: WalletReadyState[w.getWalletState()]
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
