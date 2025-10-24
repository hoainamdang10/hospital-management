import os
import re

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace staff.id.value with staff.id
    new_content = content.replace('staff.id.value', 'staff.id')
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed: {filepath}")
        return True
    return False

# Fix use cases
use_cases_dir = 'src/application/use-cases'
for filename in os.listdir(use_cases_dir):
    if filename.endswith('.ts'):
        filepath = os.path.join(use_cases_dir, filename)
        replace_in_file(filepath)

# Fix repository
repo_file = 'src/infrastructure/repositories/SupabaseProviderStaffRepository.ts'
replace_in_file(repo_file)

print("Done!")

