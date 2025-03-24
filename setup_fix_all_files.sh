#!/bin/bash

# Download the fix_all_files.sh script
curl -o ~/fix_all_files.sh https://raw.githubusercontent.com/Fakezak/Psycho-MD/main/fix_all_files.sh

# Make the script executable
chmod +x ~/fix_all_files.sh

# Optionally, you can create a command alias for easier use
echo 'alias fixall="~/fix_all_files.sh"' >> ~/.bashrc

# Apply the changes
source ~/.bashrc

echo "Fix all files setup completed. Use 'fixall' command to fix all files."
