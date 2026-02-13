export const SNAP_ID = 'npm:@algorandfoundation/algorand-metamask-snap';

export async function connectSnap() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
        throw new Error('MetaMask not found');
    }

    try {
        await ethereum.request({
            method: 'wallet_requestSnaps',
            params: {
                [SNAP_ID]: {},
            },
        });

        // Get the account
        const result = await ethereum.request({
            method: 'wallet_invokeSnap',
            params: {
                snapId: SNAP_ID,
                request: {
                    method: 'getAccount',
                    params: { testnet: true }
                },
            },
        });

        return result;
    } catch (error) {
        console.error('Snap connection failed', error);
        throw error;
    }
}

export async function getSnapAccount() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return null;

    try {
        const result = await ethereum.request({
            method: 'wallet_invokeSnap',
            params: {
                snapId: SNAP_ID,
                request: {
                    method: 'getAccount',
                    params: { testnet: true }
                },
            },
        });
        return result; // contains address
    } catch (e) {
        return null;
    }
}

export async function signSnapTxns(txnsB64: string[]) {
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error("MetaMask not found");

    // Snap expects 'signTxns' request.
    // The expected param structure for @algorandfoundation/algorand-metamask-snap 'signTxns' 
    // needs verification. Usually `txns` array of base64 strings or objects.

    // Based on common usage:
    // params: { txns: [{ txn: 'base64...' }] }

    const snapTxns = txnsB64.map(t => ({ txn: t }));

    const result = await ethereum.request({
        method: 'wallet_invokeSnap',
        params: {
            snapId: SNAP_ID,
            request: {
                method: 'signTxns',
                params: {
                    txns: snapTxns,
                    testnet: true
                }
            },
        },
    });

    // Returns array of signed txns (base64 strings or nulls)
    // Or maybe array of Uint8Array? MetaMask usually returns hex strings or base64?
    // Usually base64 for Algorand Snap.
    return result;
}
