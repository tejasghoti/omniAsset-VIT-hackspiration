import algosdk from 'algosdk';

/**
 * Constructs an Atomic Transfer Group:
 * 1. Buyer sends ALGO to Seller.
 * 2. Seller sends Asset to Buyer.
 */
export async function createAtomicSwapGroup(
    algodClient: algosdk.Algodv2,
    buyerAddr: string,
    sellerAddr: string,
    assetId: number,
    priceMicroAlgo: number
) {
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Transaction 1: Payment (Buyer -> Seller)
    const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: buyerAddr,
        to: sellerAddr,
        amount: priceMicroAlgo,
        suggestedParams,
    });

    // Transaction 2: Asset Transfer (Seller -> Buyer)
    const axferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: sellerAddr,
        to: buyerAddr,
        assetIndex: assetId,
        amount: 1,
        suggestedParams,
    });

    // Group the transactions
    const txns = [payTxn, axferTxn];
    return algosdk.assignGroupID(txns);
}

/**
 * Helper to Opt-In to an Asset (Required for Buyer before receiving)
 */
export async function optInToAsset(
    algodClient: algosdk.Algodv2,
    account: string,
    assetId: number,
    transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>
) {
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Opt-in is a 0 amount transfer to self
    const optInTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: account,
        to: account,
        assetIndex: assetId,
        amount: 0,
        suggestedParams,
    });

    const signed = await transactionSigner([optInTxn], [0]);
    const response = await algodClient.sendRawTransaction(signed).do();
    return response.txId;
}
