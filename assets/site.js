/** Homework registry. Add another entry to publish the next assignment. */
const HOMEWORKS = [
  {
    id: '01', tag: 'ELLIPTIC CURVES', category: 'Public-key cryptography',
    title: 'Private Key → Public Key',
    subtitle: 'Elliptic-curve scalar multiplication, explored.',
    description: 'Compute Q = kG on a toy finite-field curve. Follow every point addition, animate the process, and study the resulting coordinate and bit distributions.',
    tags: ['Point addition', 'SVG animation', 'Statistics'],
    href: 'homeworks/hmwk-01/', icon: 'Q = kG',
    variant: 'a'
  },
  {
    id: '02', tag: 'ETHEREUM WALLETS', category: 'Wallet standards & hashing',
    title: 'From Seed to Address',
    subtitle: 'The complete Ethereum wallet pipeline.',
    description: 'Trace BIP-39, BIP-32, BIP-44, secp256k1, Keccak-256 and EIP-55. Derive a real test-vector address and explore its statistical properties.',
    tags: ['BIP standards', 'Live derivation', 'Keccak-256'],
    href: 'homeworks/hmwk-02/', icon: '0x…',
    variant: 'b'
  }
];

const grid = document.querySelector('#homework-grid');
const published = document.querySelector('#published-count');
const indexCount = document.querySelector('#index-count');
if (published) published.textContent = String(HOMEWORKS.length).padStart(2, '0');
if (indexCount) indexCount.textContent = String(HOMEWORKS.length).padStart(2, '0');
if (grid) {
  // This registry contains local, authored HTML, not untrusted user input.
  for (const hw of HOMEWORKS) {
    const card = document.createElement('article');
    card.className = `homework-card card-${hw.variant}`;
    card.innerHTML = `
      <div class="card-top"><span class="card-kicker">HMWK <b>${hw.id}</b> <i>/</i> ${hw.tag}</span><span class="card-arrow" aria-hidden="true">↗</span></div>
      <div class="card-art" aria-hidden="true"><div class="art-rings"></div><span>${hw.icon}</span><small>${hw.category.toUpperCase()}</small></div>
      <div class="card-content"><p class="card-number">ASSIGNMENT ${hw.id}</p><h3>${hw.title}</h3><p class="card-subtitle">${hw.subtitle}</p><p class="card-description">${hw.description}</p>
      <div class="chip-row">${hw.tags.map(tag=>`<span>${tag}</span>`).join('')}</div></div>
      <a class="card-link" href="${hw.href}" aria-label="Open homework ${hw.id}: ${hw.title}">Open homework <span aria-hidden="true">↗</span></a>`;
    grid.append(card);
  }
}
