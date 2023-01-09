import { CHAIN_ID_APTOS } from "@certusone/wormhole-sdk";
import { BaseWalletAdapter, Wallet, WalletReadyState } from "@manahippo/aptos-wallet-adapter";
import { useCallback, useMemo } from "react";
import { AptosWallet } from "wallet-aggregator-aptos";
import { useChangeWallet, useWalletFromChain, useWalletsForChain } from "wallet-aggregator-react";

interface AptosContextState {
  wallets: Wallet[];
  address: string;
  connect: (name: string) => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSubmitTransaction: (tx: any) => Promise<any>;
  connected: boolean;
  network: string | undefined;
}

export const useAptosContext = (): AptosContextState => {
  const changeWallet = useChangeWallet();
  const wallet = useWalletFromChain(CHAIN_ID_APTOS);
  const wallets = useWalletsForChain(CHAIN_ID_APTOS);

  const walletsMemo = useMemo(() => {
    return (wallets as AptosWallet[])
      .map(w => ({
        adapter: w.getAdapter() as BaseWalletAdapter,
        readyState: WalletReadyState[w.getWalletState()]
      }))
  }, [ wallets ]);

  const address = useMemo(() => wallet?.getPublicKey() || '', [ wallet ]);
  const connected = useMemo(() => address !== undefined && address.length > 0, [ address ]);
  const network = useMemo(() => wallet ? (wallet as AptosWallet).getAdapter().network.name : undefined, [ wallet ])

  const connect = useCallback(async (walletName: string) => {
    const selectedWallet = wallets.find(w => w.getName() === walletName);
    if (!selectedWallet) throw new Error(`Wallet ${walletName} does not exist`);
    await selectedWallet.connect();
    changeWallet(selectedWallet);
  }, [ wallets, changeWallet ])

  // const connect = useCallback(() => { if (!wallet) throw new Error('No aptos wallet'); return wallet!.connect() }, [ wallet ]);
  const disconnect = useCallback(() => { if (!wallet) throw new Error('No aptos wallet'); return wallet!.disconnect() }, [ wallet ]);
  const signAndSubmitTransaction = useCallback((tx) => { if (!wallet) throw new Error('No aptos wallet'); return wallet!.sendTransaction(tx) }, [ wallet ]);

  return useMemo(() => ({
    address,
    connect,
    disconnect,
    signAndSubmitTransaction,
    wallets: walletsMemo,
    connected,
    network
  }), [
    address,
    connect,
    disconnect,
    signAndSubmitTransaction,
    walletsMemo,
    connected,
    network
  ]);
}
