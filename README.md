# Applied Cryptography — Interactive Homework Portfolio

**Student:** Samuele Tortora  
**Student ID:** 2344522  
**Delivery:** static website on GitHub Pages  
**Built with:** HTML5, CSS3, JavaScript, SVG, browser Web Crypto (where supported)

## Website

The repository is a portfolio, **not a single homework**. The root `index.html` is an overview with links to every published experiment. New assignments go into new folders and get added to the central registry in `assets/site.js`.

### Published assignments

| Homework | Topic | Page |
| --- | --- | --- |
| 01 | Elliptic-curve scalar multiplication on E(F17); point map, repeated addition, double-and-add, statistical exploration | `homeworks/hmwk-01/index.html` |
| 02 | Ethereum mnemonic → HD private key → public key → address → EIP-55; history, hashing comparison, 160-bit address statistics | `homeworks/hmwk-02/index.html` |

## Directory layout

```
index.html
README.md
assets/
  site.css
  site.js                  # edit HOMEWORKS to add an assignment
homeworks/
  hmwk-01/
    index.html
    styles.css
    script.js              # toy curve math + visual interactive laboratory
  hmwk-02/
    index.html
    styles.css
    crypto.js              # native JS BIP-39 / BIP-32 / ECC / Keccak / EIP-55
    script.js              # interactions, charts, stats
 tests/
  test_ecc.js
  test_wallet.js
```

## Publish to GitHub Pages

1. **Extract** the ZIP. Open the folder `Samuele-Tortora-Cryptography-Homeworks`.
2. Upload **the contents of that folder** to the root of your existing GitHub repository (not the folder itself). The main `index.html` must be in the repository root, at the same level as `assets` and `homeworks`.
3. Go to **Settings → Pages → Build and deployment**; select **Deploy from a branch**, branch **main**, folder **/(root)**, and **Save**.
4. Your homepage will be available at `https://USERNAME.github.io/REPOSITORY/` when GitHub Pages finishes deploying. Clicking each card opens the corresponding homework.

**Existing repository with an old `index.html`:** replace it with the new root `index.html`. Old root-level `script.js` and `style.css` from a previous draft can be deleted if they are no longer used. This version keeps every homework's own code inside its own folder.

GitHub Pages runs a static site. Nothing needs to be installed by your professor. For Homework 02, modern browsers and a secure origin (HTTPS/localhost) are required for the native Web Crypto API; GitHub Pages provides HTTPS.

## Add a new homework

1. Create `homeworks/hmwk-03/index.html`, `styles.css`, and `script.js`.
2. Open `assets/site.js` and append an object to the `HOMEWORKS` list. Example:

```js
{
  id: '03', tag: 'CRYPTOGRAPHY', category: 'New topic',
  title: 'Homework Three', subtitle: 'The next assignment.',
  description: 'Explain the experiment here.',
  tags: ['Interactive', 'JavaScript'],
  href: 'homeworks/hmwk-03/', icon: '03', variant: 'a'
}
```

3. Commit/push changes. The homepage count and card list update automatically.

## Homework 01 — Reference checks

Toy curve: `y² = x³ + 7 (mod 17)` with point `G = (1,5)`, scalar `k = 6`:

```
G  = (1, 5)
2G = (2, 10)
3G = (5, 9)
4G = (12, 1)
5G = (12, 16)
6G = (5, 8)
9G = O   (point at infinity; order(G) = 9)
```

There are 17 finite points + infinity, totaling 18 group elements. This is a **tiny insecure teaching curve**, not the real Ethereum secp256k1 curve.

## Homework 02 — Real browser-side reference checks

Public Hardhat example (never put funds here):

```
mnemonic: test test test test test test test test test test test junk
path:     m/44'/60'/0'/0/0
address:  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

Another public BIP-39 sample:

```
mnemonic: abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
path:     m/44'/60'/0'/0/0
address:  0x9858EfFD232B4033E47d90003D41EC34EcaEda94
```

Homework 02 **does perform the actual derivations** for these fixed, public test phrases. It uses browser Web Crypto for BIP-39 PBKDF2-HMAC-SHA512 and BIP-32 HMAC-SHA512. The real secp256k1 point multiplication and Keccak-256 / SHA3-256 are implemented in dependency-free JavaScript for educational inspection. It computes actual EIP-55 casing. It intentionally does *not* accept personal mnemonic phrases or become a real wallet.

### Statistical method / limitations

For `N = 8, 16, 32` consecutive address indices, the page derives each 20-byte address and reports:

- Count of distinct addresses (within the small sample only).
- Proportion of one bits in address bytes, out of `160N` bits.
- Counts for the 16 hexadecimal symbols over `40N` output nibbles.
- Frequencies of one bits by bit position (displayed as averages over 16 groups of 10 bit positions).
- Mean Hamming distance in the 160 address bits between outputs at adjacent indices.
- Single-input-bit flip experiment for Keccak-256 digests; side-by-side real SHA3-256 computation.

These results are descriptive and **not proofs** of uniformity, independence, ECDLP difficulty, avalanche properties in general, preimage resistance or collision resistance. EIP-55 is only an error-detecting checksum, not an authenticity mechanism.

## Reproducible automated tests (optional)

With a current Node.js version:

```
node tests/test_ecc.js
node tests/test_wallet.js
```

No `npm install` is necessary. The tests cover the toy-curve group law, order and trace, EIP-55 cases from the specification, Keccak/SHA3 vectors, secp256k1 point multiplication compared with Node's native implementation, BIP-39/BIP-32 Ethereum address fixtures, and basic statistical invariants.

## Primary documentation

- [BIP-39](https://bips.dev/39/)
- [BIP-32](https://bips.dev/32/)
- [BIP-44](https://bips.dev/44/)
- [SLIP-44](https://github.com/satoshilabs/slips/blob/master/slip-0044.md)
- [Ethereum account model](https://ethereum.org/developers/docs/accounts/)
- [EIP-55](https://eips.ethereum.org/EIPS/eip-55)
- [NIST FIPS 202 / SHA-3](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.202.pdf)

### Disclaimer

This is an interactive educational demonstration and **not production cryptographic or wallet software**. No dependencies, analytics, wallets, private-key storage or transactions are used.
