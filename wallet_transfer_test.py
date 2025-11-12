#!/usr/bin/env python3
"""
Wallet Transfer Proof URLs Test
Test wallet transfer data to check if spend_limit_proof_url and budget_aspire_proof_url fields are populated in the database.
"""

import requests
import json
from datetime import datetime

class WalletTransferProofURLTester:
    def __init__(self, base_url="https://admin-proof-fix.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        
    def authenticate_admin(self):
        """Authenticate as admin (admin/admin123)"""
        print("🔐 Authenticating as admin...")
        
        admin_login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        try:
            response = requests.post(
                f"{self.api_url}/admin/auth/login",
                json=admin_login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.admin_token = data['access_token']
                    print("✅ Admin authentication successful")
                    return True
                else:
                    print("❌ Admin authentication failed: No access token in response")
                    return False
            else:
                print(f"❌ Admin authentication failed: HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Admin authentication error: {str(e)}")
            return False
    
    def get_wallet_transfer_requests(self):
        """Call GET /api/admin/wallet-transfer-requests to get all wallet transfer requests"""
        print("📋 Retrieving wallet transfer requests...")
        
        if not self.admin_token:
            print("❌ No admin token available")
            return None
        
        headers = {
            'Authorization': f'Bearer {self.admin_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            response = requests.get(
                f"{self.api_url}/admin/wallet-transfer-requests",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"✅ Retrieved {len(data)} wallet transfer requests")
                    return data
                else:
                    print("❌ Response is not a list")
                    return None
            else:
                print(f"❌ Failed to retrieve wallet transfers: HTTP {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Error retrieving wallet transfers: {str(e)}")
            return None
    
    def analyze_proof_urls(self, wallet_transfers):
        """Analyze wallet transfers for proof URL population"""
        print("🔍 Analyzing proof URL fields...")
        
        if not wallet_transfers:
            print("❌ No wallet transfer data to analyze")
            return
        
        # Find approved and completed transfers
        approved_transfers = []
        completed_transfers = []
        all_transfers = []
        
        for transfer in wallet_transfers:
            status = transfer.get('status', '').lower()
            all_transfers.append(transfer)
            
            if status == 'approved':
                approved_transfers.append(transfer)
            elif status == 'completed':
                completed_transfers.append(transfer)
        
        approved_completed_transfers = approved_transfers + completed_transfers
        
        print(f"📊 Transfer Status Summary:")
        print(f"   Total transfers: {len(all_transfers)}")
        print(f"   Approved transfers: {len(approved_transfers)}")
        print(f"   Completed transfers: {len(completed_transfers)}")
        print(f"   Approved + Completed: {len(approved_completed_transfers)}")
        
        if len(approved_completed_transfers) == 0:
            print("⚠️  No approved or completed transfers found for proof URL testing")
            return
        
        # Analyze proof URL fields
        transfers_with_spend_limit = 0
        transfers_with_budget_aspire = 0
        transfers_with_both_proofs = 0
        transfers_missing_both = 0
        
        sample_with_proofs = []
        sample_missing_proofs = []
        
        print(f"\n🔍 Analyzing {len(approved_completed_transfers)} approved/completed transfers:")
        
        for i, transfer in enumerate(approved_completed_transfers):
            transfer_id = transfer.get('id', 'unknown')
            status = transfer.get('status', 'unknown')
            amount = transfer.get('amount', 0)
            
            spend_limit_proof_url = transfer.get('spend_limit_proof_url')
            budget_aspire_proof_url = transfer.get('budget_aspire_proof_url')
            
            # Check if proof URLs are populated (not null/empty)
            has_spend_limit = spend_limit_proof_url is not None and spend_limit_proof_url != ""
            has_budget_aspire = budget_aspire_proof_url is not None and budget_aspire_proof_url != ""
            
            if has_spend_limit:
                transfers_with_spend_limit += 1
            
            if has_budget_aspire:
                transfers_with_budget_aspire += 1
            
            if has_spend_limit and has_budget_aspire:
                transfers_with_both_proofs += 1
                if len(sample_with_proofs) < 3:
                    sample_with_proofs.append({
                        'id': transfer_id,
                        'status': status,
                        'amount': amount,
                        'spend_limit_proof_url': spend_limit_proof_url,
                        'budget_aspire_proof_url': budget_aspire_proof_url
                    })
            elif not has_spend_limit and not has_budget_aspire:
                transfers_missing_both += 1
                if len(sample_missing_proofs) < 3:
                    sample_missing_proofs.append({
                        'id': transfer_id,
                        'status': status,
                        'amount': amount,
                        'spend_limit_proof_url': spend_limit_proof_url,
                        'budget_aspire_proof_url': budget_aspire_proof_url
                    })
        
        # Print analysis results
        print(f"\n📊 PROOF URL ANALYSIS RESULTS:")
        print(f"   spend_limit_proof_url populated: {transfers_with_spend_limit}/{len(approved_completed_transfers)} ({transfers_with_spend_limit/len(approved_completed_transfers)*100:.1f}%)")
        print(f"   budget_aspire_proof_url populated: {transfers_with_budget_aspire}/{len(approved_completed_transfers)} ({transfers_with_budget_aspire/len(approved_completed_transfers)*100:.1f}%)")
        print(f"   Both proof URLs populated: {transfers_with_both_proofs}/{len(approved_completed_transfers)} ({transfers_with_both_proofs/len(approved_completed_transfers)*100:.1f}%)")
        print(f"   Both proof URLs missing: {transfers_missing_both}/{len(approved_completed_transfers)} ({transfers_missing_both/len(approved_completed_transfers)*100:.1f}%)")
        
        # Print sample data
        if sample_with_proofs:
            print(f"\n✅ SAMPLE TRANSFERS WITH PROOF URLs:")
            for i, sample in enumerate(sample_with_proofs, 1):
                print(f"   Sample {i}:")
                print(f"     ID: {sample['id']}")
                print(f"     Status: {sample['status']}")
                print(f"     Amount: {sample['amount']}")
                print(f"     spend_limit_proof_url: {sample['spend_limit_proof_url']}")
                print(f"     budget_aspire_proof_url: {sample['budget_aspire_proof_url']}")
                print()
        
        if sample_missing_proofs:
            print(f"❌ SAMPLE TRANSFERS MISSING PROOF URLs:")
            for i, sample in enumerate(sample_missing_proofs, 1):
                print(f"   Sample {i}:")
                print(f"     ID: {sample['id']}")
                print(f"     Status: {sample['status']}")
                print(f"     Amount: {sample['amount']}")
                print(f"     spend_limit_proof_url: {sample['spend_limit_proof_url']}")
                print(f"     budget_aspire_proof_url: {sample['budget_aspire_proof_url']}")
                print()
        
        # Determine root cause
        print(f"\n🎯 ROOT CAUSE ANALYSIS:")
        if transfers_with_both_proofs == 0:
            print("   ❌ ISSUE TYPE: A) Data missing in database (fields are null/empty)")
            print("   📝 FINDING: All approved transfers have null/empty proof URL fields")
            print("   🔧 RECOMMENDATION: Check wallet transfer approval process - proof URLs not being saved")
        elif transfers_with_both_proofs == len(approved_completed_transfers):
            print("   ✅ ISSUE TYPE: B) Frontend not displaying them correctly (fields exist but UI doesn't show)")
            print("   📝 FINDING: All approved transfers have populated proof URL fields")
            print("   🔧 RECOMMENDATION: Check frontend UI logic for displaying proof URLs")
        else:
            print("   ⚠️  ISSUE TYPE: Mixed - Partial data issue")
            print(f"   📝 FINDING: Only {transfers_with_both_proofs}/{len(approved_completed_transfers)} approved transfers have both proof URLs")
            print("   🔧 RECOMMENDATION: Check wallet transfer approval process for inconsistent proof URL saving")
        
        return {
            'total_approved_completed': len(approved_completed_transfers),
            'with_spend_limit': transfers_with_spend_limit,
            'with_budget_aspire': transfers_with_budget_aspire,
            'with_both_proofs': transfers_with_both_proofs,
            'missing_both': transfers_missing_both,
            'sample_with_proofs': sample_with_proofs,
            'sample_missing_proofs': sample_missing_proofs
        }
    
    def run_test(self):
        """Run the complete wallet transfer proof URL test"""
        print("🚀 Starting Wallet Transfer Proof URL Test")
        print("=" * 60)
        
        # Step 1: Authenticate as admin
        if not self.authenticate_admin():
            print("❌ Test failed: Could not authenticate as admin")
            return False
        
        # Step 2: Get wallet transfer requests
        wallet_transfers = self.get_wallet_transfer_requests()
        if wallet_transfers is None:
            print("❌ Test failed: Could not retrieve wallet transfer requests")
            return False
        
        # Step 3: Analyze proof URLs
        results = self.analyze_proof_urls(wallet_transfers)
        if results is None:
            print("❌ Test failed: Could not analyze proof URLs")
            return False
        
        # Step 4: Final summary
        print("\n" + "=" * 60)
        print("📋 FINAL TEST SUMMARY")
        print("=" * 60)
        
        if results['with_both_proofs'] == results['total_approved_completed']:
            print("✅ TEST RESULT: SUCCESS - All approved transfers have proof URLs")
            print("🔍 LIKELY CAUSE: Frontend display issue")
            test_passed = True
        elif results['with_both_proofs'] == 0:
            print("❌ TEST RESULT: FAILED - No approved transfers have proof URLs")
            print("🔍 LIKELY CAUSE: Database/backend issue - proof URLs not being saved")
            test_passed = False
        else:
            print("⚠️  TEST RESULT: PARTIAL - Some approved transfers missing proof URLs")
            print("🔍 LIKELY CAUSE: Inconsistent proof URL saving process")
            test_passed = False
        
        print(f"📊 STATISTICS:")
        print(f"   Approved/Completed transfers: {results['total_approved_completed']}")
        print(f"   With both proof URLs: {results['with_both_proofs']}")
        print(f"   Missing both proof URLs: {results['missing_both']}")
        print(f"   Success rate: {results['with_both_proofs']/results['total_approved_completed']*100:.1f}%")
        
        return test_passed

def main():
    """Main function to run the wallet transfer proof URL test"""
    tester = WalletTransferProofURLTester()
    success = tester.run_test()
    
    if success:
        print("\n🎉 Test completed successfully!")
        exit(0)
    else:
        print("\n💥 Test completed with issues found!")
        exit(1)

if __name__ == "__main__":
    main()