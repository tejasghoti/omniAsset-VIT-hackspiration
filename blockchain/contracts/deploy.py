import os
from pathlib import Path
from dotenv import load_dotenv
from algosdk.v2client import algod
from algosdk import mnemonic, account
from algokit_utils import (
    ApplicationClient,
    ApplicationSpecification,
    get_algod_client,
    get_indexer_client,
    get_account,
    Account as AlgoKitAccount
)
import json

# Correct import for newer algokit-utils if needed, or stick to v2
# In v2, get_account works. In v3, it might change.
# Assuming standard algokit-utils.

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

def get_config_account():
    # Try to get account from MNEMONIC env var
    mn = os.getenv("DEPLOYER_MNEMONIC")
    if not mn:
        print("DEPLOYER_MNEMONIC not found in .env")
        return None
    pk = mnemonic.to_private_key(mn)
    addr = account.address_from_private_key(pk)
    return AlgoKitAccount(private_key=pk, address=addr)

def main():
    algod_client = get_algod_client()
    indexer_client = get_indexer_client()
    
    deployer = get_config_account()
    if not deployer:
        print("Please set DEPLOYER_MNEMONIC in .env")
        # For localnet, we could use kmd, but the prompt says TestNet.
        return

    print(f"Deploying with account: {deployer.address}")

    # Read artifacts
    # deployed from blockchain/contracts/deploy.py
    # artifacts are in blockchain/contracts/artifacts
    artifacts_path = Path(__file__).parent / "artifacts"
    app_spec_path = artifacts_path / "Marketplace.arc56.json"
    
    if not app_spec_path.exists():
        # Fallback to manual spec construction if arc56 not generated correctly or different name
        # But puyapy generated Marketplace.arc56.json
        print(f"Artifact not found: {app_spec_path}")
        return

    with open(app_spec_path) as f:
        app_spec_def = json.load(f)

    app_spec = ApplicationSpecification.from_json(json.dumps(app_spec_def))

    # Initialize ApplicationClient
    app_client = ApplicationClient(
        algod_client=algod_client,
        app_spec=app_spec,
        signer=deployer,
    )

    # Deploy
    print("Deploying application...")
    # create/update/replace
    result = app_client.deploy(
        version="1.0.0",
        allow_delete=True,
        allow_update=True,
        on_schema_break="append",
        on_update="append",
    )
    
    print(f"Deployed App ID: {result.app_id}")
    print(f"App Address: {result.app_address}")

if __name__ == "__main__":
    main()
