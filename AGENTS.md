## Product architecture

- Use managed Lovable OAuth for social login and initialize missing profiles before panel navigation; preserve existing account types across both callback and popup flows.

- Keep negotiations asynchronous and structured around service hours and total value; free-form live chat is intentionally excluded to make offers auditable.
- Verify provider payment server-side before activating any care booking; a checkout redirect or user-supplied callback alone is not proof of payment.
- Keep payout state distinct from collection state because the existing checkout provider exposes no documented automated marketplace transfer API.
- Sell only negotiated care appointments through embedded checkout; do not introduce subscriptions or fixed-price products.
- Maintain the application schema through Cloud migrations and regenerate database types from that schema; connecting an empty backend must not leave client queries without table definitions.
- Gateway account registration is admin-only and separate from checkout routing; operational validation never proves account ownership or payment and must disclose real link creation.
- Store gateway credentials only in managed server secrets, never in account records or browser forms; missing credentials must leave validation pending rather than report success.
<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
