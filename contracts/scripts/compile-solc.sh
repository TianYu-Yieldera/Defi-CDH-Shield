#!/bin/bash

# CDPShield Compilation Script using solc
# Usage: ./scripts/compile-solc.sh

set -e

SOLC_PATH="$HOME/.cache/hardhat-nodejs/compilers-v2/linux-amd64/solc-linux-amd64-v0.8.24+commit.e11b9ed9"

if [ ! -f "$SOLC_PATH" ]; then
    echo "Solc compiler not found. Please install it first."
    exit 1
fi

echo "Compiling contracts with solc 0.8.24..."

echo "Building directory structure..."
mkdir -p build

echo "Compiling CDPShield..."
$SOLC_PATH \
    --base-path . \
    --include-path node_modules \
    --output-dir build \
    --bin \
    --abi \
    --optimize \
    --optimize-runs 200 \
    --overwrite \
    contracts/core/CDPShield.sol

echo "Compiling Mock contracts..."
$SOLC_PATH \
    --base-path . \
    --include-path node_modules \
    --output-dir build \
    --bin \
    --abi \
    --optimize \
    --optimize-runs 200 \
    --overwrite \
    contracts/mocks/MockERC20.sol \
    contracts/mocks/MockPriceOracle.sol \
    contracts/mocks/MockDEXAggregator.sol

echo ""
echo "Compilation successful!"
echo "Artifacts saved to ./build/"
echo ""
echo "Main contracts:"
ls -lh build/CDPShield.* 2>/dev/null || true
echo ""
echo "Mock contracts:"
ls -lh build/Mock*.* 2>/dev/null || true
