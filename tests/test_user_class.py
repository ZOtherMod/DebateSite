#!/usr/bin/env python3

import sys
import os
sys.path.append('/Users/nicolas/Documents/Code/DebatePlatform/backend')

from database import Database

def test_user_class_functionality():
    """Test the new UserClass functionality"""
    print("Testing UserClass functionality...")
    
    # Create database instance with temporary file database
    import tempfile
    temp_db = tempfile.mktemp(suffix='.db')
    db = Database(temp_db)  # Use temporary file database for testing
    
    # Test 1: Check if test account was created
    print("\n1. Testing test account creation...")
    print(f"Database path: {db.db_path}")
    print(f"Use postgres: {db.use_postgres}")
    result = db.authenticate_user('test', 'passpass')
    print(f"Auth result: {result}")
    if result:
        print(f"✅ Test account exists: {result}")
        if result['user_class'] == 2:
            print("✅ Test account has correct UserClass (2)")
        else:
            print(f"❌ Test account has wrong UserClass: {result['user_class']}")
    else:
        print("❌ Test account not found")
    
    # Test 2: Create a regular user and check UserClass
    print("\n2. Testing regular user creation...")
    user_id = db.create_user('regular_user', 'password123')
    if user_id:
        user_info = db.get_user_by_id(user_id)
        print(f"✅ Regular user created: {user_info}")
        if user_info['user_class'] == 0:
            print("✅ Regular user has correct UserClass (0)")
        else:
            print(f"❌ Regular user has wrong UserClass: {user_info['user_class']}")
    else:
        print("❌ Failed to create regular user")
    
    # Test 3: Create a user with custom UserClass
    print("\n3. Testing custom UserClass creation...")
    admin_id = db.create_user('admin_user', 'admin_pass', user_class=3)
    if admin_id:
        admin_info = db.get_user_by_id(admin_id)
        print(f"✅ Admin user created: {admin_info}")
        if admin_info['user_class'] == 3:
            print("✅ Admin user has correct UserClass (3)")
        else:
            print(f"❌ Admin user has wrong UserClass: {admin_info['user_class']}")
    else:
        print("❌ Failed to create admin user")
    
    # Test 4: Test authentication includes UserClass
    print("\n4. Testing authentication with UserClass...")
    auth_result = db.authenticate_user('admin_user', 'admin_pass')
    if auth_result and 'user_class' in auth_result:
        print(f"✅ Authentication includes UserClass: {auth_result}")
    else:
        print(f"❌ Authentication missing UserClass: {auth_result}")
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    test_user_class_functionality()
