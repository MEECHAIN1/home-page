# MeeChain Overlay Checklist Badge Flow

## 1) Security cleanup
- [ ] `npm uninstall pkg`
- [ ] `npm audit fix`

## 2) Dependency direction (Hardhat v3 + ethers v5)
- [ ] Keep `hardhat` on v3
- [ ] Keep `ethers` on v5
- [ ] Avoid incompatible `@nomicfoundation/hardhat-chai-matchers` latest tag

## 3) Network config
- [ ] `hardhat.config.cjs` contains `meechain` network
- [ ] `PRIVATEKEY` is set in environment
- [ ] RPC URL points to `https://rpc.meechain.live`

## 4) Read totalSupply
- [ ] Put token address in `TOKEN_ADDRESS`
- [ ] Run: `node scripts/totalSupply.js`
- [ ] Verify output includes `Using account:`
- [ ] Verify output includes `Total Supply:`

## 5) Badge tiers
- 🥉 **Bronze**: config + script ready
- 🥈 **Silver**: totalSupply successfully read once
- 🥇 **Gold**: repeatable run from clean shell with env only
- 🎖 **Legend**: run after `npm audit fix` with no moderate/high findings

## Quick run example
```bash
export PRIVATEKEY=0xyourprivatekey
export TOKEN_ADDRESS=0xyourtoken
export MEECHAIN_RPC_URL=https://rpc.meechain.live
node scripts/totalSupply.js
```
