import { CHAIN_ID_ETH } from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import React, {
  ReactChildren,
  useCallback,
  useContext, useMemo,
  useState
} from "react";
import { Wallet } from "wallet-aggregator-core";
import { EVMWallet, EVMWalletConnectWallet, EVMWeb3Wallet } from "wallet-aggregator-evm";
import { useChangeWallet, useUnsetWalletFromChain, useWalletFromChain, useWalletsForChain } from "wallet-aggregator-react";

export type Provider = ethers.providers.Web3Provider | undefined;
export type Signer = ethers.Signer | undefined;

export enum ConnectType {
  METAMASK,
  WALLETCONNECT,
}

export interface Connection {
  connectType: ConnectType;
  name: string;
  icon: string;
}

interface IEthereumProviderContext {
  connect(connectType: ConnectType): void;
  disconnect(): void;
  provider: Provider;
  chainId: number | undefined;
  signer: Signer;
  signerAddress: string | undefined;
  providerError: string | null;
  availableConnections: Connection[];
  wallet: Wallet | undefined;
}

const EthereumProviderContext = React.createContext<IEthereumProviderContext>({
  connect: (connectType: ConnectType) => {},
  disconnect: () => {},
  provider: undefined,
  chainId: undefined,
  signer: undefined,
  signerAddress: undefined,
  providerError: null,
  availableConnections: [],
  wallet: undefined
});

export const EthereumProviderProvider = ({
  children,
}: {
  children: ReactChildren;
}) => {
  const [providerError, setProviderError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>(undefined);
  const [chainId, setEvmChainId] = useState<number | undefined>(undefined);
  const [signer, setSigner] = useState<Signer>(undefined);
  const [signerAddress, setSignerAddress] = useState<string | undefined>(
    undefined
  );

  const wallet = useWalletFromChain(CHAIN_ID_ETH);
  const changeWallet = useChangeWallet();
  const unsetWalletFromChain = useUnsetWalletFromChain();

  const availableWallets = useWalletsForChain(CHAIN_ID_ETH) as EVMWallet[];
  const availableConnections: Connection[] = availableWallets.map((w: EVMWallet) => ({
    icon: w.getIcon(),
    name: w.getName(),
    connectType: w instanceof EVMWeb3Wallet ? ConnectType.METAMASK : ConnectType.WALLETCONNECT
  }));

  const clearState = useCallback(async () => {
    unsetWalletFromChain(wallet!.getChainId());
    setProviderError(null);
    setProvider(undefined);
    setEvmChainId(undefined);
    setSigner(undefined);
    setSignerAddress(undefined);
  }, [ wallet, unsetWalletFromChain ]);

  const disconnect = useCallback(async () => {
    if (!wallet) return;

    await wallet?.disconnect();
    wallet.removeAllListeners();
    await clearState();
  }, [ wallet, clearState ]);

  const connect = useCallback(async (connectType: ConnectType) => {
    const wallet: EVMWallet = availableWallets.find(w => (connectType === ConnectType.METAMASK && w instanceof EVMWeb3Wallet) ||
                                (connectType === ConnectType.WALLETCONNECT && w instanceof EVMWalletConnectWallet))!;
    await wallet.connect();
    changeWallet(wallet);

    wallet.on('accountsChanged', () => {
      const signer = wallet.getSigner();
      const signerAddress = wallet.getPublicKey()!;
      setSigner(signer);
      setSignerAddress(signerAddress);
    });

    wallet.on('evmChainChanged', (newEvmChainId: number) => {
      setEvmChainId(newEvmChainId);
    })

    wallet.on('disconnect', () => {
      // disconnected from device, clear state
      clearState();
    })

    const provider = wallet.getProvider()!;
    const evmChainId = wallet.getEvmChainId()!;
    const signer = wallet.getSigner();
    const signerAddress = wallet.getPublicKey()!;

    setProvider(provider);
    setEvmChainId(evmChainId);
    setSigner(signer);
    setSignerAddress(signerAddress);
  }, [ availableWallets, changeWallet, clearState ]);

  const contextValue = useMemo(
    () => ({
      connect,
      disconnect,
      provider,
      chainId,
      signer,
      signerAddress,
      providerError,
      availableConnections,
      wallet
    }),
    [
      connect,
      disconnect,
      provider,
      chainId,
      signer,
      signerAddress,
      providerError,
      availableConnections,
      wallet
    ]
  );
  return (
    <EthereumProviderContext.Provider value={contextValue}>
      {children}
    </EthereumProviderContext.Provider>
  );
};
export const useEthereumProvider = () => {
  return useContext(EthereumProviderContext);
};
