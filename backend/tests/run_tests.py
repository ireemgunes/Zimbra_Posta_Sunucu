import sys
import os
import inspect
import traceback
import time

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import test_security_audit

def main():
    print("=" * 70)
    print("MAILOS 23-POINT SECURITY AUDIT & PENETRATION TEST SUITE")
    print("=" * 70)
    
    test_functions = [
        getattr(test_security_audit, name)
        for name in dir(test_security_audit)
        if name.startswith("test_") and callable(getattr(test_security_audit, name))
    ]
    
    passed = 0
    failed = 0
    start_time = time.time()
    
    for test_fn in test_functions:
        name = test_fn.__name__
        doc = inspect.getdoc(test_fn) or "No description"
        print(f"\n[RUNNING] {name} ...")
        print(f"          {doc}")
        try:
            test_fn()
            print(f"          --> [PASSED] OK")
            passed += 1
        except Exception as e:
            print(f"          --> [FAILED] ERROR")
            traceback.print_exc()
            failed += 1
            
    elapsed = time.time() - start_time
    print("\n" + "=" * 70)
    print(f"TEST RUN SUMMARY: Total: {len(test_functions)} | Passed: {passed} OK | Failed: {failed} ERROR | Duration: {elapsed:.2f}s")
    print("=" * 70)
    
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()

