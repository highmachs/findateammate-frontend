import re
import sys

def audit_sql_dump(file_path):
    table_counts = {}
    current_table = None
    in_copy_block = False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("COPY"):
                    match = re.search(r"COPY ([\w\.]+) .* FROM stdin;", line)
                    if match:
                        current_table = match.group(1)
                        table_counts[current_table] = 0
                        in_copy_block = True
                elif line.strip() == "\." and in_copy_block:
                    in_copy_block = False
                    current_table = None
                elif in_copy_block:
                    table_counts[current_table] += 1
                    
        print("## Data Audit Summary")
        print("| Table Name | Row Count |")
        print("| :--- | :--- |")
        if not table_counts:
            print("| No data found | - |")
        else:
            for table, count in sorted(table_counts.items()):
                print(f"| {table} | {count} |")
                
    except Exception as e:
        print(f"Error reading file: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script.py <path_to_sql_file>")
    else:
        audit_sql_dump(sys.argv[1])
