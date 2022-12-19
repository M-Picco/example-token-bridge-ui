import { ChainId } from "@certusone/wormhole-sdk";
import { useCallback, useState } from "react";
import { Wallet } from "wormhole-wallet-aggregator";
import { useChangeWallet, useUnsetWalletFromChain, useWalletFromChain } from "wormhole-wallet-aggregator-react";
import ConnectWalletDialog from "./ConnectWalletDialog";
import ToggleConnectedButton from "./ToggleConnectedButton";

const ConnectWalletButton = ({ chainId }: { chainId: ChainId }) => {
  const wallet = useWalletFromChain(chainId);
  const changeWallet = useChangeWallet();
  const unsetWalletFromChain = useUnsetWalletFromChain();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const connect = async (w: Wallet) => {
    await w.connect();
    changeWallet(w);
  };
  const disconnect = async () => {
    if (!wallet) return;
    await wallet.disconnect();
    unsetWalletFromChain(chainId);
  };

  const pk = wallet?.getPublicKey();

  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, [setIsDialogOpen]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, [setIsDialogOpen]);

  return (
    <>
      <ToggleConnectedButton
        connect={openDialog}
        disconnect={disconnect}
        connected={!!pk}
        pk={pk || ""}
      />
      <ConnectWalletDialog
        isOpen={isDialogOpen}
        onSelect={connect}
        onClose={closeDialog}
        chainId={chainId}
      />
      {/* {providerError ? (
        <Typography variant="body2" color="error">
          {providerError}
        </Typography>
      ) : null} */}
    </>
  );
};

export default ConnectWalletButton;
