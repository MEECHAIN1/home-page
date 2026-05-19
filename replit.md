# MeeBot - MeeChain Blockchain Dashboard

## Project Overview
MeeBot is a comprehensive Web3 dashboard for the MeeChain Blockchain (Ritual Chain ID: 13390) featuring:
- **MeeBot AI Chat** - AI-powered assistant with Thai language support
- **Wallet Integration** - MetaMask/Demo wallet connection with send/receive
- **NFT Marketplace** - Browse, mint, and trade NFTs
- **Staking & Mining** - Multiple staking pools with APY
- **Smart Contract Interactions** - Token, NFT, and Staking contract operations

## Project Structure
```
meebot/
├── src/
│   ├── web3/
│   │   ├── contracts.js      # Web3 contract interactions (token, NFT, staking)
│   │   └── wallet.js         # MetaMask wallet integration
│   ├── js/
│   │   ├── app.js           # Main dashboard UI and routing
│   │   ├── wallet.js        # Frontend wallet operations (send/receive)
│   │   ├── chat-widget.js   # MeeBot AI chat component
│   │   ├── price-widget.js  # Token price display
│   │   └── data.js          # Mock data for dashboard
│   ├── css/
│   │   ├── main.css         # Main stylesheet
│   │   ├── animations.css   # UI animations
│   │   └── price-widget.css # Price widget styles
│   └── assets/
│       └── images/          # NFT and icon images
├── blockchain/              # Smart contracts (Hardhat project)
├── nginx/                   # Nginx configuration for meebot.io & meechain.xyz
├── server.js               # Express.js backend server
├── package.json            # Dependencies
└── index.html              # Main HTML file

## Backend API Endpoints

### Health & Network
- `GET /api/health` - Server health check
- `GET /api/network` - Network configuration (chain ID, RPC, contracts)

### Web3 Status
- `GET /api/web3/status` - Web3 connection status
- `GET /api/chain/stats` - Block number, gas price
- `GET /api/chain/transactions` - Recent transactions (5)

### Token (MEE ERC-20)
- `GET /api/token/info` - Token name, symbol, decimals, totalSupply
- `GET /api/token/balance/:address` - Token balance for address
- `GET /api/wallet/balance/:address` - Native + token balance
- `GET /api/wallet/allowance/:owner/:spender` - Token allowance

### NFT (ERC-721)
- `GET /api/nft/info` - NFT contract info
- `GET /api/nft/balance/:address` - NFT count for address
- `GET /api/nft/token/:tokenId` - NFT token info (owner, URI)
- `POST /api/nft/describe` - AI-generated Thai NFT descriptions

### Staking
- `GET /api/staking/info` - Pool info (totalStaked, APR)
- `GET /api/staking/user/:address` - User staking position

### MeeBot AI Chat
- `POST /api/chat` - Non-streaming chat (fallback REST)
- `POST /api/chat/stream` - Streaming chat (SSE) with real-time responses
- `DELETE /api/chat/:sessionId` - Clear chat history
- `WS /ws` - **WebSocket streaming chat** (primary, replaces SSE)
  - Send: `{"type":"chat","message":"...","sessionId":"..."}`
  - Recv: `{"type":"delta","delta":"..."}` (streaming) → `{"type":"done"}`
  - Send: `{"type":"clear","sessionId":"..."}` to clear history

### WebSocket JSON-RPC (Blockchain)
- `WS /ws/rpc` - **JSON-RPC 2.0 over WebSocket** for blockchain calls
  - Standard: `eth_chainId`, `eth_blockNumber`, `eth_gasPrice`, `eth_getBalance`
  - MeeChain: `mee_tokenBalance`, `mee_nftBalance`, `mee_stakingInfo`
  - Ledger: `mee_ledgerBalance`, `mee_chainStats`, `mee_recentTx`
  - Example: `{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}`
  - Via tunnel: `wss://rpc.meechain.live/ws/rpc`

### Price Data
- `GET /api/price/mintme` - MEE/POL price from MintMe Exchange
- `GET /api/nodecloud/stats` - NodeCloud monitoring data

## Frontend Features

### Wallet Integration
- **Connect**: MetaMask, WalletConnect, Coinbase, Demo mode
- **Send**: MEE tokens to other addresses (with confirmation)
- **Receive**: Display address + QR code
- **Balance**: Display native MEE and MEE token balances

### NFT Marketplace
- **Browse**: Filter by category (Art, Gaming, Ritual, Avatar)
- **Create**: Mint new NFTs with AI-generated descriptions
- **Buy/Offer**: Simulate purchases and make offers
- **Search**: Find NFTs by name or creator

### Staking
- **Pools**: Standard (85% APY), Premium (148% APY), Ritual (248% APY)
- **Stake**: Lock MEE for rewards (30/90/180 days)
- **Claim**: Withdraw staking rewards
- **APY**: Real-time from smart contract

### MeeBot AI
- **Chat**: Real-time streaming responses (SSE)
- **Knowledge**: MeeChain blockchain, contracts, wallet, NFT guides
- **Language**: Thai-focused with English for technical terms
- **Sessions**: Maintains conversation history per session

## Configuration

### Environment Variables (`.env`)
```
PORT=5000
OPENAI_API_KEY=sk-xxx          # OpenAI API key
OPENAI_BASE_URL=https://xxx    # Custom LLM provider (optional)
DRPC_RPC_URL=https://xxx       # dRPC gateway
DRPC_ACCESS_KEY=xxx            # dRPC access key
NODECORE_API_KEY=xxx           # NodeCore API (server-side proxy)
NODECLOUD_API_KEY=xxx          # NodeCloud API (infrastructure)
NODECLOUD_STATS_KEY=xxx        # NodeCloud stats API
VITE_RPC_URL=https://xxx       # Fallback RPC (frontend)
VITE_TOKEN_CONTRACT_ADDRESS=0x5FbDB...  # MEE Token
VITE_NFT_CONTRACT_ADDRESS=0xe7f17...    # NFT Contract
VITE_STAKING_CONTRACT_ADDRESS=0x9fE46...# Staking Contract
CHAIN_ID=13390                 # MeeChain Chain ID
CORS_ORIGINS=https://meechain.xyz,http://localhost:5000
```

### Nginx Configuration
- `nginx/meebot.io.conf` - meebot.io domain (port 5000)
- `nginx/meechain.xyz.conf` - meechain.xyz domain (port 5000)
- Both support SSL/TLS via Let's Encrypt Certbot
- Proxy to Node.js on localhost:5000
- API buffering disabled for SSE streaming

## Smart Contract ABI

### Supported Functions

**ERC-20 (Token)**
- `transfer(to, amount)` - Send MEE tokens
- `approve(spender, amount)` - Approve allowance
- `balanceOf(address)` - Get balance
- `allowance(owner, spender)` - Get allowance

**ERC-721 (NFT)**
- `mint(to, uri)` - Mint new NFT
- `safeMint(to, uri)` - Safe mint
- `transfer(from, to, tokenId)` - Transfer NFT
- `balanceOf(owner)` - Get NFT balance
- `ownerOf(tokenId)` - Get NFT owner

**Staking**
- `stake(amount)` - Deposit tokens
- `unstake(amount)` - Withdraw tokens
- `claimReward()` - Claim rewards
- `getPendingReward(user)` - Get pending rewards

## Wallet Operations

### Frontend (src/js/wallet.js)
- `connectMetaMask()` - Connect MetaMask wallet
- `connectDemoWallet()` - Demo wallet for testing
- `executeSendToken()` - Send MEE tokens
- `openReceiveModal()` - Show receive address + QR
- `refreshBalance()` - Update balance from chain

### Web3 Service (src/web3/contracts.js)
- `getTokenInfo()` - Token metadata
- `getTokenBalance(address)` - Token balance
- `getTokenAllowance(owner, spender)` - Allowance
- `getNFTInfo()` - NFT metadata
- `getNFTBalance(address)` - NFT count
- `getStakingInfo()` - Staking pool data
- `getChainStats()` - Block/gas info

## Deployment

### Production Domains
- **meebot.io** - Main domain
- **meechain.xyz** - Alternative domain

### SSL/TLS
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Request certificates
sudo certbot certonly --nginx -d meebot.io -d www.meebot.io -d meechain.xyz -d www.meechain.xyz
```

### Running Server
```bash
npm install
PORT=5000 node server.js
```

## Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Wallet Connect (Frontend)
1. Open dashboard
2. Click "👛 กระเป๋าเงิน" (Wallet)
3. Select MetaMask or Demo
4. Demo mode allows testing without real wallet

### Chat with MeeBot
1. Navigate to "🤖 MeeBot" tab
2. Type message in Thai or English
3. Get streaming AI responses

## Known Limitations

- **RPC Fallback**: If dRPC offline, uses mock data for demo purposes
- **Demo Mode**: Wallet operations are simulated
- **Gas**: No actual gas fees in simulation mode
- **Network**: Test on Ritual Chain (Chain ID: 13390)

## Next Steps for Enhancement

1. **Real Smart Contract Deployment** - Deploy on Ritual Chain
2. **Wallet Write Functions** - Direct blockchain transactions via API
3. **Advanced Price Analysis** - Historical data, charts, technical analysis
4. **Voice Commands** - Thai language voice input/output
5. **Mobile App** - React Native for iOS/Android
6. **Payment Gateway** - Stripe/PayPal integration

## Support

- **AI Chat**: Use MeeBot in dashboard
- **Documentation**: See JSDOC_COMPLETE.md
- **Issues**: Check deployment logs in `/var/log/nginx/`

