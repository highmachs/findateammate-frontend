import re
import sys

def extract_table_data(file_path, output_file):
    target_tables = ['public.users', 'public.posts', 'public.messages', 'public.connection_requests', 'public.notifications']
    current_table = None
    in_copy_block = False
    table_headers = {}
    data_store = {table: [] for table in target_tables}
    
    print(f"Reading from: {file_path}")
    print(f"Writing to: {output_file}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("COPY"):
                    # Match COPY public.users (id, name, ...) FROM stdin;
                    match = re.search(r"COPY ([\w\.]+) \((.*?)\) FROM stdin;", line)
                    if match:
                        current_table = match.group(1)
                        if current_table in target_tables:
                            columns = match.group(2).split(', ')
                            table_headers[current_table] = columns
                            in_copy_block = True
                        else:
                            in_copy_block = False
                            current_table = None
                    else:
                        # Fallback for COPY without specific column list (usually implied all)
                        match_simple = re.search(r"COPY ([\w\.]+) .* FROM stdin;", line)
                        if match_simple:
                           current_table = match_simple.group(1)
                           if current_table in target_tables:
                               in_copy_block = True
                               # We will warn about missing headers later
                           else:
                               in_copy_block = False
                elif line.strip() == "\." and in_copy_block:
                    in_copy_block = False
                    current_table = None
                elif in_copy_block and current_table:
                    # Parse row
                    row = line.strip().split('\t')
                    # Handle \N as null/empty
                    row = ["(null)" if x == "\\N" else x for x in row]
                    data_store[current_table].append(row)

        with open(output_file, 'w', encoding='utf-8') as out:
            out.write("# Detailed Database Data Audit\n\n")
            out.write(f"Source Backup: `{file_path}`\n\n")
            
            for table in target_tables:
                rows = data_store[table]
                count = len(rows)
                out.write(f"## Table: {table}\n")
                out.write(f"**Row Count:** {count}\n\n")
                
                if count == 0:
                    out.write("_No data found in this table._\n\n")
                    continue
                
                # Determine headers
                headers = table_headers.get(table, [f"Col_{i}" for i in range(len(rows[0]))])
                
                # Format specific tables for better readability
                if table == 'public.users':
                    # Don't show password, privacy settings might be bulky
                    exclude_indices = []
                    try:
                        if 'password' in headers:
                            exclude_indices.append(headers.index('password'))
                    except:
                        pass
                    
                    # Filter headers and rows
                    display_headers = [h for i, h in enumerate(headers) if i not in exclude_indices]
                    display_rows = [[c for i, c in enumerate(r) if i not in exclude_indices] for r in rows]
                else:
                    display_headers = headers
                    display_rows = rows

                # Write Markdown Table
                # Header
                out.write("| " + " | ".join(display_headers) + " |\n")
                out.write("| " + " | ".join(["---"] * len(display_headers)) + " |\n")
                
                # Rows
                for row in display_rows:
                    clean_row = []
                    for cell in row:
                        # Truncate very long cells for markdown readability
                        if len(cell) > 100:
                            clean_row.append(cell[:97] + "...")
                        else:
                            # Escape pipes in content
                            clean_row.append(cell.replace("|", "\|").replace("\n", " "))
                    out.write("| " + " | ".join(clean_row) + " |\n")
                out.write("\n")
        
        print(f"Successfully generated report at {output_file}")

    except Exception as e:
        print(f"Error processing file: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python script.py <input_sql> <output_md>")
    else:
        extract_table_data(sys.argv[1], sys.argv[2])
