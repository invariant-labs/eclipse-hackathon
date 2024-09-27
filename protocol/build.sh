set -e

# Define the keypair JSON content
protocol='[241,48,9,154,226,69,2,237,110,236,42,215,101,9,180,54,188,33,143,1,23,195,191,216,97,134,168,119,88,143,212,134,211,92,205,71,53,55,43,4,243,58,249,177,89,205,83,154,251,68,50,69,145,195,183,45,251,29,209,130,116,26,126,3]'
invariant='[100,94,104,217,253,66,112,71,155,206,9,70,30,6,93,185,82,49,169,250,96,24,120,234,25,145,148,106,134,60,55,123,176,93,3,185,31,73,255,255,107,72,82,123,112,9,31,16,214,15,171,107,164,37,143,208,35,195,133,157,224,137,246,197]'

# Write the keypair JSON to file
mkdir -p target/deploy
echo "$protocol" > target/deploy/protocol-keypair.json
echo "$invariant" > target/deploy/invariant-keypair.json

# Build the program using Anchor
anchor build

# Navigate to the SDK directory
cd sdk

# Build the SDK
npm run build