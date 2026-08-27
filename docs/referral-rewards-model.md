# Referral Rewards & Token Model

Working model for funding rider/driver reward tokens out of platform commission,
with a multi-level referral chain. Numbers below are illustrative — the
structure and the invariants are the point.

> **Not legal or tax advice.** The regulatory section flags issues that need a
> lawyer and a CA to sign off before launch. See [Legal guardrails](#7-legal-guardrails).

---

## 1. The base unit economics

| | Share | On a ₹1,000 fare |
|---|---|---|
| Driver payout | 90% of fare | ₹900 |
| Platform commission | 10% of fare | ₹100 |
| → Reward pool (50% of commission) | 5% of fare | ₹50 |
| → Platform net | 5% of fare | ₹50 |

Two formulas drive everything:

```
Reward pool per ride    P = F × t × s        (t = take rate, s = share to rewards)
Platform net per ride   N = F × t × (1 − s)
```

With `t = 10%`, `s = 50%` → `P = 5% of F`, `N = 5% of F`.

### Is 5% net enough?

Illustrative per-ride cost on a ₹1,000 fare (assumptions, not researched figures):

| Cost | ₹ |
|---|---|
| Payment gateway (2% on a ₹200 online advance) | 4 |
| Maps / SMS / OTP / cloud | 3 |
| Support (1-in-8 rides contacts, ₹40/contact) | 5 |
| Fraud, chargebacks, insurance reserve | 3 |
| **Total variable cost** | **~15** |
| **Contribution margin** | **~₹35 (3.5% of fare)** |

That is thin. Uber-class operators run 20–25% take rates. Two options:

- **Ramp `s`**: launch at `s = 30%` (pool = 3% of fare, net = 7%), move to 50% once
  contribution margin per ride is proven at volume.
- **Raise `t`** to 12–15% and keep `s = 50%`.

Sensitivity:

| Take rate `t` | Reward share `s` | Pool (% of fare) | Net (% of fare) |
|---|---|---|---|
| 10% | 30% | 3.0% | 7.0% |
| 10% | 50% | **5.0%** | **5.0%** |
| 12% | 50% | 6.0% | 6.0% |
| 15% | 40% | 6.0% | 9.0% |
| 20% | 30% | 6.0% | 14.0% |

---

## 2. Splitting the pool

The pool is split into fixed weights. **This is the single most important design
choice**: every payout is a share of a capped pool, never an independent
percentage of the fare. The pool cannot be exceeded no matter how deep or wide
the referral tree gets.

| Bucket | Weight | ₹ on ₹1,000 | % of fare | Duration |
|---|---|---|---|---|
| Rider cashback (own rides) | 40% | 20.00 | 2.00% | Forever |
| Rider referral chain | 26% | 13.00 | 1.30% | Referee's first 25 rides |
| Driver loyalty (own rides) | 14% | 7.00 | 0.70% | Forever |
| Driver referral chain | 12% | 6.00 | 0.60% | Referee's first 25 rides |
| Unclaimed buffer | 8% | 4.00 | 0.40% | — |
| **Total** | **100%** | **50.00** | **5.00%** | |

**Unclaimed levels roll into the rider's own cashback.** Early on, most users
have no upline — that value should not evaporate, or the program feels dead on
day one. As the network deepens, value shifts naturally from self-cashback to
the chain. Self-balancing, no special-casing.

---

## 3. Chain payout math

### Rider chain — 3 levels, weights 75 / 19 / 6

Pool `C = ₹13.00`:

| Level | Weight | ₹ per ride | % of fare | Over 25 rides |
|---|---|---|---|---|
| L1 (direct referrer) | 75% | 9.75 | 0.975% | ₹243.75 |
| L2 | 19% | 2.47 | 0.247% | ₹61.75 |
| L3 | 6% | 0.78 | 0.078% | ₹19.50 |
| **Total** | **100%** | **13.00** | **1.30%** | **₹325.00** |

### Driver chain — 2 levels, weights 80 / 20

Pool `C = ₹6.00`:

| Level | Weight | ₹ per ride | % of fare | Over 25 rides |
|---|---|---|---|---|
| L1 | 80% | 4.80 | 0.48% | ₹120.00 |
| L2 | 20% | 1.20 | 0.12% | ₹30.00 |

### The `k · r` test — why these weights and not others

This is the rule that separates a referral program from a pyramid.

Let `k` = how many active people a typical member refers, and `r` = the decay
ratio between consecutive level weights. The total paid out at level `n` scales
as:

```
payout(level n) ∝ (k · r)ⁿ
```

- **`k · r > 1`** → deeper levels pay more than shallow ones. Recruiting beats
  riding. The product becomes the network, not the cab. This is pyramid
  dynamics, and it is what regulators look for.
- **`k · r < 1`** → each level pays less than the one above. Referral stays a
  bonus on top of a real service.

Worked example of the trap. Chain pool ₹15, 5 levels, `r = 0.5`, `k = 5`, each
member riding ₹4,000/month:

| Level | People | Monthly income |
|---|---|---|
| L1 | 5 | ₹155 |
| L2 | 25 | ₹387 |
| L3 | 125 | ₹968 |
| L4 | 625 | ₹2,420 |
| L5 | 3,125 | ₹6,050 |
| **Total** | 3,905 | **₹9,979/month** |

`k · r = 2.5`. Income is dominated by L4–L5, i.e. by recruitment depth. It also
requires 3,905 people under one member — unreachable for anyone but the earliest
entrants, so the advertised number is a lie for the median user.

The recommended weights give `r ≈ 0.25–0.32` across 3 levels. At `k = 3`,
`k · r ≈ 0.76–0.95 < 1` — level income declines monotonically:

| Level | People (k=3) | Income over the 25-ride window |
|---|---|---|
| L1 | 10 directs | ₹2,437.50 |
| L2 | 30 | ₹1,852.50 |
| L3 | 90 | ₹1,755.00 |

Honest, and roughly ₹500/month for an unusually good promoter. That is the
number to advertise.

---

## 4. Why the chain must be time-boxed

Lifetime referral commissions are usually **more expensive than paid ads**.

Uncapped, a referee doing ₹4,000/month for 18 months generates ₹72,000 GMV.
At 1.30% chain cost that is **₹936 paid out per acquired user, forever**.
Typical Indian consumer-app CAC is well below that — so the program would be a
worse deal than just buying the user.

Boxing the chain at the referee's **first 25 qualifying rides** caps it:

```
Referral cost per acquired rider = 25 × ₹1,000 × 1.30% = ₹325
```

Now it is directly comparable to a CAC line item, and it is bounded.

Three separate budgets, three different rules:

| Budget | Bucket | Rule |
|---|---|---|
| **Acquisition** | Referral chains | Time/volume-boxed (25 rides or 6 months, whichever first) |
| **Retention** | Rider self-cashback | Perpetual — it is self-funding, it only pays when they ride |
| **Supply** | Driver loyalty + driver chain | Loyalty perpetual, chain boxed |

---

## 5. Token design

**Recommendation: closed-loop, non-transferable ride credit. 1 coin = ₹1.**

Not a tradable crypto token. Reasons in [§7](#7-legal-guardrails).

| Property | Setting |
|---|---|
| Peg | 1 coin = ₹1, fixed |
| Transferable | No |
| Cash-out | No — ride credit only |
| Expiry | 12 months from issue |
| Redemption cap | ≤ 10% of a ride's fare |
| Applied to | Online advance first, then fare balance |

### Why the redemption cap is exactly 10%

Per ride the platform collects `F − coins` but still owes the driver `0.9F`:

```
Platform cash = F − coins − 0.9F = 0.1F − coins  ≥ 0   ⟹   coins ≤ 0.10 F
```

At the cap the platform nets ₹0 on that ride — never negative. Since coins are
*issued* at 5% of fare and *redeemable* at up to 10%, a rider needs roughly two
earning rides to fully use one redemption cap. The system is self-limiting.

### Liability and real cost

Issued coins are a deferred revenue liability (Ind AS 115 / IFRS 15). Loyalty
programs typically see redemption rates of 15–30%, i.e. substantial breakage.

```
Liability = outstanding coins × (1 − breakage) × cost per coin
```

At 20% breakage the 5% pool actually costs **~4.0% of fare**, so effective
platform net is **~6.0%** rather than 5.0%. Do not *design* for breakage — but
do model it, and recognise it proportionally over the redemption period rather
than all at once.

---

## 6. Anti-gaming rules

This app is cash-heavy, which makes staged rides the main attack: a driver and a
rider collude on fake trips to farm the pool. Minimum set:

- Rewards accrue **only on rides where the online advance was actually paid** and
  the trip completed with a valid GPS trace.
- Minimum distance and minimum fare to qualify.
- Same-device / same-payment-instrument / circular-referral detection at signup.
- Per-device and per-account daily reward caps.
- Chain earnings require the earner to have taken **≥1 ride in the last 30 days** —
  no dormant harvesting.
- L2 unlocks at ≥2 active directs, L3 at ≥5. Compression: skip inactive uplines,
  max 2 skips, remainder to the buffer.
- Clawback window on cancelled/disputed/refunded rides.
- Hard monthly cap on chain earnings per user, e.g. `max(₹1,000, 2 × own monthly ride spend)`.
  This last one hard-links reward to genuine consumption and is the strongest
  single defence against the program being used as a pure recruitment vehicle.

---

## 7. Legal guardrails

India-specific, and this space has real enforcement history.

**Hard rules — these are what keep it a referral program rather than a money circulation scheme:**

1. **No joining fee, no pack purchase, no investment.** Ever.
2. **Earning requires a completed ride.** Enrolment alone pays nothing. Under the
   Prize Chits and Money Circulation Schemes (Banning) Act 1978, a scheme paying
   for *enrolment or the enrolment activity of downline members* is the banned
   thing; Rule 10 of the Consumer Protection (Direct Selling) Rules, 2021
   expressly bars pyramid and money circulation schemes dressed as direct
   selling.
3. **No income promises or "returns".** Publish typical, not maximum, earnings.
   Fare.Coop advertises ~$8,424/month from 20 referrals — that is precisely the
   kind of claim that draws scrutiny.
4. **Fund payouts only from realised commission on completed rides.** Never from
   new-user money.

**Why closed-loop and not a crypto token:** gift cards and loyalty points are
*not* classified as Virtual Digital Assets in India, so they sit outside the 30%
VDA tax and the 1% TDS under s.194S. Issue a tradable token instead and every
reward becomes a taxable VDA event for the user, plus the scheme starts to look
like an investment product. Not worth it at this stage.

**Needs a CA:** GST treatment of coin redemption (discount vs consideration),
whether cash-equivalent referral payouts attract TDS, and the deferred revenue
treatment of the coin liability.

**Cautionary precedents in this exact vertical:** the "Hello Taxi" cab-aggregator
scam (~₹250 crore, ~1,000 victims) and the Bike Bot bike-taxi Ponzi. Indian
enforcement is primed on the combination of *cab app + referral + promised
returns*.

---

## 8. Does this exist in ride-hailing?

| Model | Who | Structure |
|---|---|---|
| Single-level flat referral | Uber, Lyft, Ola, Bolt | Two-sided flat bonus ($100–$1,100 for driver referrals at Uber's peak), gated on the referee completing N trips. Uber later scrapped its rider program. Lyft runs multi-*tier* bonuses, but tiers are volume thresholds for one driver, not a referral chain. |
| Token rewards, no chain | **DRIFE** (Bengaluru) | Zero commission, DRF token on EOS, ~30% of supply in an ecosystem fund for rider/driver incentives, DAO governance. |
| Token rewards, no chain | **TADA / MVL** (Singapore) | Zero commission, flat per-ride software fee to drivers. MVL points for good service and reviews, convertible to MVL coin. 7 years, 6 countries. |
| Two-tier referral from profit | **Fare.Coop** | 25% of *net profits* into a referral pool, Tier 1 + Tier 2, lifetime. Closest structural match to your idea. Earnings projections are aggressive. |
| Full MLM | **REVO Ride** | Rank-based (Free IBO → Executive), 20% on personal referrals, 10% Tier 1, 3–5% Tier 2, 1–5% Tiers 3–5, plus "open line infinite level" and a 2% revenue-share pool. PCV qualification with compression below $100/month. |

**Conclusion:** the combination you described — a reward token funded from
commission and distributed up a multi-level chain — does **not** exist at scale
in any established cab operator. Token rewards exist (DRIFE, TADA) but are flat
loyalty, not chains. Multi-level chains exist (REVO, Fare.Coop) but only at small
unproven players, and REVO is structured as an MLM business opportunity, which is
the shape that attracts regulatory attention.

That is a genuine gap, not necessarily a moat. The reason incumbents stop at one
level is economic, not imaginative: **lifetime multi-level commissions cost more
than paid acquisition** (§4). The boxed-window design is what makes a chain
defensible here.

---

## 9. Recommended launch configuration

Start conservative, widen once contribution margin is proven.

| Parameter | Launch | Target |
|---|---|---|
| Take rate `t` | 10% | 12% |
| Reward share `s` | 30% | 50% |
| Pool | 3.0% of fare | 5.0% of fare |
| Rider chain levels | 2 (80/20) | 3 (75/19/6) |
| Driver chain levels | 1 | 2 (80/20) |
| Chain window | 15 rides | 25 rides |
| Coin redemption cap | 10% of fare | 10% of fare |
| Coin expiry | 12 months | 12 months |
| Monthly chain cap | ₹1,000 | `max(₹1,000, 2 × own spend)` |

Instrument from day one: reward cost as % of GMV, referred-user retention vs
organic, chain payout per acquired user vs blended CAC, coin liability
outstanding, breakage rate, and rides-per-referrer (the recruit-vs-ride ratio —
if it drops, the incentives have tipped the wrong way).

---

## Sources

- [DRIFE white paper](https://drife.gitbook.io/white-paper) · [DRIFE takes on Uber in India (IEEE Spectrum)](https://spectrum.ieee.org/blockchain-ridehailing-app-drife-takes-on-uber-in-india) · [techwireasia](https://techwireasia.com/2022/08/how-ride-hailing-app-drife-is-taking-on-uber-ola-in-india-by-decentralizing-the-ecosystem/)
- [TADA / MVL, Vulcan Post](https://vulcanpost.com/644448/tada-ride-hailing-app-blockchain-singapore/) · [MVL: how TADA reached a million users](https://medium.com/mvl-ecosystem/how-mvls-mobility-service-tada-reached-a-million-users-7b17d0d69a6a)
- [REVO Ride — Earn As A Rider](https://revoride.com/?page=earn-as-a-rider) · [Fare.Coop](https://fare.coop/)
- [Uber referral program case study](https://www.trybeans.com/blog/uber-referral-program-analysis) · [Lyft multi-tier bonuses](https://help.lyft.com/hc/en-us/all/articles/360052387974-Multi-tier-bonuses)
- [Consumer Protection (Direct Selling) Rules 2021 — tightening the noose on pyramid schemes (Lexology)](https://www.lexology.com/library/detail.aspx?g=a1529a72-a5f5-4882-b11a-41cbfea664af) · [MLM schemes vs direct selling entities (Mondaq)](https://www.mondaq.com/india/corporate-and-company-law/561704/mlm-schemes-v-mlm-direct-selling-entities-peeling-off-the-masquerade)
- [Crypto tax in India 2026 — VDA scope, 30% + 1% TDS (Koinly)](https://koinly.io/guides/crypto-tax-india/) · [CoinDCX](https://coindcx.com/blog/cryptocurrency/crypto-taxes-in-india/)
- [Loyalty program liability & breakage (Brandmovers)](https://blog.brandmovers.com/what-cfos-need-to-know-about-loyalty-program-liability-in-2026) · [Customer loyalty programmes under IFRS 15](https://ifrscommunity.com/knowledge-base/customer-loyalty-programmes/)
- [Hello Taxi cab-app scam, ₹250 crore (Gulf News)](https://gulfnews.com/world/asia/india/india-woman-who-duped-over-1-000-people-of-dh125-million-in-fake-cab-app-scam-arrested-in-goa-1.1602672234022) · [Banned MLM companies in India](https://infinitemlmsoftware.com/blog/banned-mlm-companies-in-india)
