

# Define the keypair JSON content
protocol='[125,25,103,8,46,252,74,11,10,231,221,13,113,82,123,17,118,205,218,140,247,37,159,150,140,109,50,158,185,90,57,107,244,112,134,82,19,192,92,70,188,247,227,156,239,127,119,76,193,85,143,146,12,43,48,189,79,193,48,21,49,108,226,209]'

# Write the keypair JSON to file
echo "$protocol" > target/deploy/protocol-keypair.json

# Build the program using Anchor
anchor build

# Navigate to the SDK directory
# cd sdk

# Build the SDK
# npm run build