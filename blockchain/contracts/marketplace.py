from algopy import ARC4Contract, BoxMap, Asset, UInt64, Account, Global, Txn, gtxn, itxn, arc4, gtxn

class ListingInfo(arc4.Struct):
    seller: Account
    price: UInt64
    creator: Account
    royalty: UInt64 # Basis points (e.g., 500 = 5%)

class Marketplace(ARC4Contract):
    def __init__(self) -> None:
        self.listings = BoxMap(Asset, ListingInfo)
        self.admin = Global.creator_address
        self.platform_fee_bps = UInt64(100) # 1% Platform Fee

    @arc4.abimethod
    def list_asset(
        self, 
        asset: Asset, 
        price: UInt64, 
        creator: Account,
        royalty: UInt64,
        axfer: gtxn.AssetTransferTransaction, 
        mbr_pay: gtxn.PaymentTransaction
    ) -> None:
        # Check if contract is opted in. If not, opt in.
        is_opted_in = Global.current_application_address.is_opted_in(asset)
        
        required_mbr = UInt64(0)
        if not is_opted_in:
            required_mbr += UInt64(100_000) # 0.1 ALGO for ASA opt-in
            
            # Inner txn to opt in
            itxn.AssetTransfer(
                xfer_asset=asset,
                asset_receiver=Global.current_application_address,
                asset_amount=0
            ).submit()

        # Check if box exists
        if asset not in self.listings:
            # Box MBR: 2500 + 400 * (key_size + value_size)
            # Key: Asset (8 bytes)
            # Value: ListingInfo (Address 32 + UInt64 8 + Address 32 + UInt64 8 = 80 bytes)
            # Total 88 bytes. 
            required_mbr += UInt64(2500) + UInt64(400) * (UInt64(8) + UInt64(80))

        if required_mbr > 0:
            assert mbr_pay.receiver == Global.current_application_address
            assert mbr_pay.amount >= required_mbr
            assert mbr_pay.sender == Txn.sender

        # Verify asset transfer to contract (Escrow)
        assert axfer.asset_receiver == Global.current_application_address
        assert axfer.xfer_asset == asset
        assert axfer.asset_amount > 0
        assert axfer.sender == Txn.sender

        self.listings[asset] = ListingInfo(
            seller=Txn.sender, 
            price=price,
            creator=creator,
            royalty=royalty
        )

    @arc4.abimethod
    def buy_asset(self, asset: Asset, payment: gtxn.PaymentTransaction) -> None:
        assert asset in self.listings, "Asset not listed"
        listing = self.listings[asset].copy()

        # Verify payment to Contract
        assert payment.receiver == Global.current_application_address
        assert payment.amount == listing.price
        assert payment.sender == Txn.sender

        # Calculate Splits
        # 1. Platform Fee
        platform_share = (listing.price * self.platform_fee_bps) // UInt64(10000)
        
        # 2. Creator Royalty
        royalty_share = (listing.price * listing.royalty) // UInt64(10000)
        
        # 3. Seller Share
        seller_share = listing.price - platform_share - royalty_share

        # Execute Splits via Inner Transactions
        # Pay Seller
        itxn.Payment(
            receiver=listing.seller,
            amount=seller_share,
            fee=0 # Covered by pooled fees or sender
        ).submit()

        # Pay Creator (if royalty > 0)
        if royalty_share > 0:
            itxn.Payment(
                receiver=listing.creator,
                amount=royalty_share,
                fee=0
            ).submit()

        # Platform fee stays in contract (withdrawable by admin)

        # Send Asset to Buyer
        itxn.AssetTransfer(
            xfer_asset=asset,
            asset_receiver=Txn.sender,
            asset_amount=1,
            fee=0
        ).submit()

        # Listing removed? Or reduced amount? Assuming 1-of-1 NFT for now, remove it.
        # But if it was >1 amount, we'd decrement. 
        # For simplicity in this logic, we delete.
        del self.listings[asset]

        # Retrieve MBR? 
        # We should return the Box MBR to the Seller (who paid it).
        # And if asset balance is 0, we could opt out to reclaim that MBR too, 
        # but let's keep it simple: Release Box MBR to seller.
        box_mbr = UInt64(2500) + UInt64(400) * (UInt64(8) + UInt64(80))
        itxn.Payment(
            receiver=listing.seller,
            amount=box_mbr,
            fee=0
        ).submit()

    @arc4.abimethod
    def cancel_listing(self, asset: Asset) -> None:
        assert asset in self.listings
        listing = self.listings[asset].copy()
        assert listing.seller == Txn.sender

        # Return Asset
        itxn.AssetTransfer(
            xfer_asset=asset,
            asset_receiver=Txn.sender,
            asset_amount=1,
            fee=0
        ).submit()

        # Delete listing and return MBR
        del self.listings[asset]
        
        box_mbr = UInt64(2500) + UInt64(400) * (UInt64(8) + UInt64(80))
        itxn.Payment(
            receiver=Txn.sender,
            amount=box_mbr,
            fee=0
        ).submit()

    @arc4.abimethod
    def admin_withdraw(self, amount: UInt64) -> None:
        assert Txn.sender == self.admin
        itxn.Payment(
            receiver=self.admin,
            amount=amount,
            fee=0
        ).submit()
