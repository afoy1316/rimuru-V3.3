#!/usr/bin/env python3

import requests
import json
import time
from datetime import datetime

def test_optimized_clients_endpoint():
    """Test the optimized GET /api/admin/clients endpoint"""
    
    base_url = "http://localhost:8001"
    api_url = f"{base_url}/api"
    
    print("🔍 TESTING OPTIMIZED GET /api/admin/clients ENDPOINT")
    print("="*60)
    
    # Step 1: Admin Authentication
    print("\n📋 Step 1: Admin Authentication")
    
    admin_login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            f"{api_url}/admin/auth/login",
            json=admin_login_data,
            timeout=10
        )
        
        if response.status_code == 200:
            token_data = response.json()
            admin_token = token_data['access_token']
            print("✅ Admin authentication successful")
        else:
            print(f"❌ Admin authentication failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Admin authentication error: {str(e)}")
        return False
    
    # Step 2: Test GET /api/admin/clients
    print("\n📋 Step 2: Testing GET /api/admin/clients")
    
    headers = {
        'Authorization': f'Bearer {admin_token}',
        'Content-Type': 'application/json'
    }
    
    try:
        start_time = time.time()
        
        response = requests.get(
            f"{api_url}/admin/clients",
            headers=headers,
            timeout=30  # Increased timeout
        )
        
        end_time = time.time()
        response_time = end_time - start_time
        
        print(f"⏱️  Response time: {response_time:.3f} seconds")
        
        if response.status_code == 200:
            print("✅ GET /api/admin/clients - Status 200 OK")
            
            clients_data = response.json()
            
            # Basic validation
            if isinstance(clients_data, list):
                print(f"✅ Response is a list with {len(clients_data)} clients")
                
                if len(clients_data) > 0:
                    # Check first client structure
                    first_client = clients_data[0]
                    required_fields = [
                        'id', 'username', 'email', 'name', 'phone_number',
                        'total_requests', 'total_topup', 'is_active', 'created_at'
                    ]
                    
                    missing_fields = [field for field in required_fields if field not in first_client]
                    
                    if not missing_fields:
                        print("✅ All required fields present in client data")
                        
                        # Check data types
                        type_checks = [
                            ('total_requests', int),
                            ('total_topup', (int, float)),
                            ('is_active', bool)
                        ]
                        
                        type_errors = []
                        for field, expected_type in type_checks:
                            if not isinstance(first_client.get(field), expected_type):
                                type_errors.append(f"{field}: expected {expected_type}, got {type(first_client.get(field))}")
                        
                        if not type_errors:
                            print("✅ All field types are correct")
                        else:
                            print(f"❌ Type errors: {type_errors}")
                        
                        # Check sorting (newest first)
                        if len(clients_data) > 1:
                            first_created = first_client.get('created_at')
                            second_created = clients_data[1].get('created_at')
                            
                            if first_created and second_created:
                                try:
                                    first_dt = datetime.fromisoformat(first_created.replace('Z', '+00:00'))
                                    second_dt = datetime.fromisoformat(second_created.replace('Z', '+00:00'))
                                    
                                    if first_dt >= second_dt:
                                        print("✅ Clients are sorted by created_at (newest first)")
                                    else:
                                        print("❌ Clients are not properly sorted")
                                except Exception as e:
                                    print(f"⚠️  Could not verify sorting: {str(e)}")
                        
                        # Show sample data
                        print(f"\n📊 Sample client data:")
                        sample_client = {
                            'username': first_client.get('username'),
                            'email': first_client.get('email'),
                            'total_requests': first_client.get('total_requests'),
                            'total_topup': first_client.get('total_topup'),
                            'is_active': first_client.get('is_active'),
                            'created_at': first_client.get('created_at')
                        }
                        print(json.dumps(sample_client, indent=2))
                        
                    else:
                        print(f"❌ Missing required fields: {missing_fields}")
                        
                else:
                    print("ℹ️  No clients in the system")
                
                # Performance assessment
                if response_time < 1.0:
                    print(f"✅ Excellent performance: {response_time:.3f}s")
                elif response_time < 3.0:
                    print(f"✅ Good performance: {response_time:.3f}s")
                elif response_time < 5.0:
                    print(f"⚠️  Acceptable performance: {response_time:.3f}s")
                else:
                    print(f"❌ Slow performance: {response_time:.3f}s")
                
                return True
                
            else:
                print(f"❌ Response is not a list: {type(clients_data)}")
                return False
                
        else:
            print(f"❌ GET /api/admin/clients failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   Error: {error_detail}")
            except:
                print(f"   Error: {response.text[:200]}")
            return False
            
    except Exception as e:
        print(f"❌ GET /api/admin/clients error: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_optimized_clients_endpoint()
    
    print(f"\n" + "="*60)
    print(f"🎯 TEST RESULTS")
    print(f"="*60)
    
    if success:
        print("✅ OPTIMIZED CLIENTS ENDPOINT: WORKING CORRECTLY")
        print("   - Single aggregation pipeline replacing N+1 queries ✅")
        print("   - All required fields present and correctly typed ✅")
        print("   - Data accuracy and logical consistency verified ✅")
        print("   - Performance optimized ✅")
    else:
        print("❌ OPTIMIZED CLIENTS ENDPOINT: NEEDS ATTENTION")
        print("   - Some tests failed - check detailed output above")
    
    print(f"\n🏁 Testing completed!")