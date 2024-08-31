# SimpleWalletAdapter

`SimpleWalletAdapter` is a custom wallet adapter for the Solana blockchain that extends the `BaseWalletAdapter` class. It provides basic functionality for connecting and disconnecting from a wallet, handling public key retrieval, and managing wallet state. This adapter is designed to work with a custom login popup and overlay iframe.

## Features

- **Connect**: Opens a popup for user authentication and retrieves the public key.
- **Disconnect**: Disconnects from the wallet and cleans up resources.
- **Overlay Iframe**: Displays an overlay iframe during the login process.
- **Custom Popup**: Opens a customizable popup window for authentication.

