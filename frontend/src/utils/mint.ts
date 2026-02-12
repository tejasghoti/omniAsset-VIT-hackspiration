import algosdk from 'algosdk';

export async function mintAsset(
    algodClient: algosdk.Algodv2,
    account: string,
    cid: string,
    metadata: any,
    transactionSigner: (txnGroup: algosdk.Transaction[], indexesToSign: number[]) => Promise<Uint8Array[]>
) {
    const suggestedParams = await algodClient.getTransactionParams().do();

    // ARC-69: Metadata is stored in the note field as JSON
    const note = new TextEncoder().encode(JSON.stringify(metadata));

    const txn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
        from: account,
        suggestedParams,
        defaultFrozen: false,
        unitName: `OMNI`,
        assetName: metadata.properties?.file_name || `OmniAsset`,
        manager: account,
        reserve: account,
        freeze: account,
        clawback: account,
        assetURL: `ipfs://${cid}`,
        total: 1000,
        decimals: 0,
        note: note
    });

    const txnGroup = [txn];
    // Sign the transaction
    const signedTxns = await transactionSigner(txnGroup, [0]);

    // Send the transaction
    const response = await algodClient.sendRawTransaction(signedTxns).do();

    return response.txId;
}
