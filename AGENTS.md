## Product architecture

- Keep negotiations asynchronous and structured around service hours and total value; free-form live chat is intentionally excluded to make offers auditable.
- Verify provider payment server-side before activating any care booking; a checkout redirect or user-supplied callback alone is not proof of payment.
- Keep payout state distinct from collection state because the existing checkout provider exposes no documented automated marketplace transfer API.
- Sell only negotiated care appointments through embedded checkout; do not introduce subscriptions or fixed-price products.
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
