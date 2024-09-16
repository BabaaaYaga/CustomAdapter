import { BaseWalletAdapter, WalletName, WalletReadyState } from '@solana/wallet-adapter-base';
import { PublicKey, Transaction,TransactionVersion } from '@solana/web3.js';

export class SimpleWalletAdapter extends BaseWalletAdapter {
    name = "DCEX" as WalletName; // Adjust according to your WalletName enum
    url = "https://dcex-xi.vercel.app/";
    icon = "data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAFYAAAAqCAYAAAAptqxNAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAASjSURBVGhD7ZoxiBtHFIZfggsVLnSQYssIrlFIcXIllZFJCkGKKFxhHVccFwJGJBAUp1GuOTZXHMqlyF1j7hKwkQoHKeBwKhzWjUEKOEhNOAcM2sKFDFesQIEVOPAyOs1KM7uzK620A46ZDx6a3Zmdnf315u28kd5CAigi5236qYgYJawklLCSUMJKQgkrCSWsJJSwklDCSkIJKwklrCSUsJJQwkpCCSuJ+btb/45g8M+IHgi4Fof4dVpegtHAhGddEyx6vJa4Acl34xCjxyJGgwEEjMhD7Drp79qk7Lk2RsbvezPy7AP+TrF48NimjIUNpK2PhQ+29Qzmbx+j8cKmF83Dwl6zgoX3NXF/WhILhwb2X9HmHH2sbgquCTC9TS8l9GoF1Jg6bbtOehTTu5fn+snst3DRJ4xG2KlpmN0ziGwBDC/wdCchuFZg6SKem/S6KasJS+TC6jb7hWpYeCCQ1qxinukD0jq2hrRuASIWdmLadpUMX4T7oRzTMPlBFpOa+zwxzwOtKiyBiFZg76WRL/CS1l1BxsndI0P6WNRXJ4QW1j1I2+ph66cSZl2i5O95pe3dzXFtQMuh/rjPTS/7hYH6x7z4KW4KuoTdrPpO5SA8IeGOMb3HKiHAYWVhp3i8oIwGp5iBZa6+gFXPNKcMW6inmbZQYvqKRljv7ElhpUtOX55jkR1nyBDgEJ2wBKuxy7UtPpxFW/tRiatLHXZojZh+jfUaDfWntCIyYQluZ9ipo3GUmR2PQ8DTsL46IVJhx15ZYtrCXotWIHYOWO/I4ulzWhGaCIUluEMCa5mDTugQ4BBtghBLwI1PaHnM3ya8vCq8BPPZpDQhA++t0+KqPNFh66ObcNPPfuzShmISt3T4fptI6yatw8lXqcXWrCKowP6E8Vhfb3KdBxK3rs4vg7uvOUZePHMxT/mlFbFic1lfnaBSWoL5ewMatOxw8nMDTFpehoiFtcEe0CJHDOLv0OIVNv2MgA/LUH9sgOFnm0naUMzoz+9g6/MmPWL4ZQu+vr+CtNRz/QkTCi7ruMu01Ujwd+gcpZh+6NImiFc2WpY1s8iXWwT3sm6jiEUuzOSWfslG6rHmr2dwRstkiQS76Zm3JDdy5IxDF6q/tQM3Usz7n8La2hq1JJz8RSsiYwTtH0rw7R/0kIyuuK9D5RudvFodmvDZl2fLhQQqsD8LeqzdrWCOXRNuVJBfqXawssHUB6WJnmSDfdlF47H2kzKmnD6IzTZjbDTu8Jlf5ih4zS0itLDlJjM9rT5etOt4fDuHCabNeEFfeuQVzXpYdK0ZE5g/PMeLPm07JP01K5hfZ9uQ9LjGSheBsO7syp0FDsl6nK0nTjA3dLkILex80zB74Jdb29jaZzOb+ebd0Am53CLGz7I+1t27WzXvvsY4U+ScgKS2HZ8JJiJaYbUslhrifa0ZFhp7Wd9sh7XMF3XsefZkVxN28f1YQUgIkYmtLux6BrM7JTyutdCZ0YtgPT8XhJCxaZi8pWO17TfBVxB27nahC0FIWHT78DX44zH/8wf7M8r/mddA2DcTldJKQgkrCSWsJJSwklDCSkIJKwklrBQA/gMD9/NpgfPoRgAAAABJRU5ErkJggg=="
    readonly supportedTransactionVersions = new Set([
        "legacy" as TransactionVersion,
        0 as TransactionVersion,
      ]);
    private _publicKey: PublicKey | null = null;
    private _connecting: boolean = false;
    private _readyState: WalletReadyState = WalletReadyState.Installed;
    private popup: Window | null = null;
    private overlayIframe: HTMLIFrameElement | null = null;
    private popupCloseInterval: number | null = null;

    get publicKey(): PublicKey | null {
        return this._publicKey;
    }
    get connecting() {
        return this._connecting;
    }
    get readyState(): WalletReadyState {
        return this._readyState;
    }

    async connect(): Promise<void> {
        if (this.popup) {
            this.popup.focus();
            return;
        }
        const width = 400;
        const height = 600;
        
        // Calculate the position for centering the popup on the screen
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 1.9);
        this.popup = window.open(
            'https://dcex-xi.vercel.app/adapter/login',
            'Popup',
            `width=${width},height=${height},left=${left},top=${top}`
          );
        if (!this.popup) {
            throw new Error('Failed to open popup window.');
        }

        this.createOverlayIframe();
        this.detectPopupClose();

        return new Promise((resolve, reject) => {
            const handleMessage = (event: MessageEvent) => {
                if (event.origin !== 'https://dcex-xi.vercel.app') {
                    console.warn('Message origin not trusted:', event.origin);
                    return;
                }

                if (event.data.type === 'PUBLIC_KEY_RECEIVED' && event.data.publicKey) {
                    try {
                        this._publicKey = new PublicKey(event.data.publicKey);
                        this._readyState = WalletReadyState.Loadable;
                        this.emit('connect', this._publicKey);
                        resolve();
                        this.cleanup(false); // Close popup and overlay iframe after public key is received
                        window.removeEventListener('message', handleMessage);
                    } catch (error) {
                        console.error('Invalid public key received:', event.data.publicKey);
                        reject(error);
                        this.cleanup(true); // Ensure cleanup even on error, and disconnect
                    }
                }
            };

            window.addEventListener('message', handleMessage);
        });
    }

    async disconnect(): Promise<void> {
        this.cleanup(true); // Ensure cleanup and disconnection
        this._publicKey = null;
        this._readyState = WalletReadyState.Loadable;
        this.emit('disconnect');
    }

    private createOverlayIframe(): void {
        const overlayHtml = `
            <html>
                <body style="margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: rgba(0, 0, 0, 0.5);">
                    <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                        <h2>Login in progress</h2>
                        <p>Please complete your login in the popup window.</p>
                        <button id="finish-login" style="margin: 10px; padding: 10px 20px;">Finish Login</button>
                        <button id="cancel-login" style="margin: 10px; padding: 10px 20px;">Cancel Login</button>
                    </div>
                </body>
            </html>
        `;

        this.overlayIframe = document.createElement('iframe');
        this.overlayIframe.style.position = 'fixed';
        this.overlayIframe.style.top = '0';
        this.overlayIframe.style.left = '0';
        this.overlayIframe.style.width = '100%';
        this.overlayIframe.style.height = '100%';
        this.overlayIframe.style.border = 'none';
        this.overlayIframe.style.zIndex = '2147483647';
        this.overlayIframe.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

        document.body.appendChild(this.overlayIframe);

        const iframeDoc = this.overlayIframe.contentDocument || this.overlayIframe.contentWindow?.document;
        if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(overlayHtml);
            iframeDoc.close();

            const finishButton = iframeDoc.getElementById('finish-login');
            const cancelButton = iframeDoc.getElementById('cancel-login');

            finishButton?.addEventListener('click', () => {
                if (this.popup) {
                    this.popup.focus();
                }
            });

            cancelButton?.addEventListener('click', () => {
                this.disconnect(); // Disconnect the wallet when cancel is clicked
            });
        }
    }

    private detectPopupClose(): void {
        this.popupCloseInterval = window.setInterval(() => {
            if (this.popup && this.popup.closed) {
                this.cleanup(true); // Disconnect and cleanup when the popup is closed
                if (this.popupCloseInterval) {
                    window.clearInterval(this.popupCloseInterval);
                }
            }
        }, 500); // Check every 500ms if the popup is closed
    }

    private cleanup(disconnectWallet: boolean): void {
        if (this.popupCloseInterval) {
            window.clearInterval(this.popupCloseInterval);
            this.popupCloseInterval = null;
        }
        if (this.popup) {
            this.popup.close();
            this.popup = null;
        }
        if (this.overlayIframe) {
            this.overlayIframe.remove();
            this.overlayIframe = null;
        }
        if (disconnectWallet) {
            // Ensure proper disconnection handling
            this._publicKey = null;
            this._readyState = WalletReadyState.Loadable;
            this.emit('disconnect');
        }
    }

    async signTransaction(transaction: Transaction): Promise<Transaction> {
        throw new Error('This wallet does not support signing transactions.');
    }

    async signAllTransactions(transactions: Transaction[]): Promise<Transaction[]> {
        throw new Error('This wallet does not support signing transactions.');
    }

    async signMessage(message: Uint8Array): Promise<Uint8Array> {
        throw new Error('This wallet does not support signing messages.');
    }
    async sendTransaction(): Promise<string> {
       throw new Error('This wallet does not support sending transactions.');
    }
}
