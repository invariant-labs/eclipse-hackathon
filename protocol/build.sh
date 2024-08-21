set -e

# Define the keypair JSON content
protocol='[125,25,103,8,46,252,74,11,10,231,221,13,113,82,123,17,118,205,218,140,247,37,159,150,140,109,50,158,185,90,57,107,244,112,134,82,19,192,92,70,188,247,227,156,239,127,119,76,193,85,143,146,12,43,48,189,79,193,48,21,49,108,226,209]'
invarinat='[100,94,104,217,253,66,112,71,155,206,9,70,30,6,93,185,82,49,169,250,96,24,120,234,25,145,148,106,134,60,55,123,176,93,3,185,31,73,255,255,107,72,82,123,112,9,31,16,214,15,171,107,164,37,143,208,35,195,133,157,224,137,246,197]'

# Write the keypair JSON to file
mkdir -p target/deploy
echo "$protocol" > target/deploy/protocol-keypair.json
echo "$invarinat" > target/deploy/invariant-keypair.json

# Build the program using Anchor
anchor build

# Navigate to the SDK directory
cd sdk

# Build the SDK
npm run build