# Big Dipper service

What Little Dippers connect to. Built on Little Dipper's service kit (`src/kit`, copied from the Little Dipper repo's
`kit/` by `npm run sync-kit`), so Big Dipper is a *service*: it interacts, and holds no one's life.

First capability: **feedback**. A Little Dipper sends what its owner wrote, a screenshot (blurred by default in their
browser) with pins and boxes, and where it happened; this files a Linear issue and replies in their Messages.

Run locally: `BD_IDENTITY_SECRET=any-long-test-string npm start` (port 4500). Without Linear settings, feedback is
written to `./feedback-outbox`. On Render it's the `big-dipper-service` entry in `../render.yaml`.

Stateless on purpose while the platform's bigger choices (storage, accounts, the support model) are open.
