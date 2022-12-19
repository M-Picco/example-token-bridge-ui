import { CHAIN_ID_ETH } from "@certusone/wormhole-sdk";
import { ethers } from "ethers";
import React, {
  ReactChildren,
  useCallback,
  useContext, useMemo,
  useState
} from "react";
import { EthereumWallet, EthereumWalletConnectWallet, EthereumWeb3Wallet, Wallet } from "wormhole-wallet-aggregator";
import { useChangeWallet, useUnsetWalletFromChain, useWalletFromChain, useWalletsForChain } from "wormhole-wallet-aggregator-react";
import metamaskIcon from "../icons/metamask-fox.svg";
import walletconnectIcon from "../icons/walletconnect.svg";
const CacheSubprovider = require("web3-provider-engine/subproviders/cache");

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
  connectType: ConnectType | undefined;
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
  connectType: undefined,
});

export const EthereumProviderProvider = ({
  children,
}: {
  children: ReactChildren;
}) => {
  const [providerError, setProviderError] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [signer, setSigner] = useState<Signer>(undefined);
  const [signerAddress, setSignerAddress] = useState<string | undefined>(
    undefined
  );

  const wallet = useWalletFromChain(CHAIN_ID_ETH);
  const changeWallet = useChangeWallet();
  const unsetWalletFromChain = useUnsetWalletFromChain();

  const availableWallets = useWalletsForChain(CHAIN_ID_ETH) as EthereumWallet[];
  const availableConnections: Connection[] = availableWallets.map((w: Wallet) => ({
    icon: w instanceof EthereumWeb3Wallet ? metamaskIcon : walletconnectIcon,
    name: w.getName(),
    connectType: w instanceof EthereumWeb3Wallet ? ConnectType.METAMASK : ConnectType.WALLETCONNECT
  }))

  const [connectType, setConnectType] = useState<ConnectType | undefined>(
    undefined
  );

  const disconnect = useCallback(async () => {
    if (!wallet) return;

    await wallet?.disconnect();
    unsetWalletFromChain(wallet!.getChainId());
    setProviderError(null);
    setProvider(undefined);
    setChainId(undefined);
    setSigner(undefined);
    setSignerAddress(undefined);
    setConnectType(undefined);
  }, [ wallet, unsetWalletFromChain ]);

  const connect = useCallback(async (connectType: ConnectType) => {
    const wallet = availableWallets.find(w => (connectType === ConnectType.METAMASK && w instanceof EthereumWeb3Wallet) ||
                                (connectType === ConnectType.WALLETCONNECT && w instanceof EthereumWalletConnectWallet))!;
    await wallet.connect();
    changeWallet(wallet);

    const provider = wallet.getProvider()!;
    const network = await provider.getNetwork();
    const signer = wallet.getSigner();
    const signerAddress = wallet.getPublicKey()!;

    setProvider(provider);
    setConnectType(connectType);
    setChainId(network.chainId);
    setSigner(signer);
    setSignerAddress(signerAddress);
  }, [ availableWallets, changeWallet ]);

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
      connectType,
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
      connectType,
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
