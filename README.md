# SurfacesPlatformV2

From the repository root, start with the read-only status check:

```bash
npm run status
```

The command verifies the tracked capability index and evidence, then prints the
current implemented and planned scope without regenerating artifacts. Run
`npm ci` first when dependencies are not installed.

SurfacesPlatformV2 is a proof-contract repository for compiling design-system
source material into governed UI contracts, deterministic diagnostics,
artifacts, and evidence.

- [PROGRESS.md](PROGRESS.md) tracks the product-outcome milestones and current
  focus.
- [VISION.md](VISION.md) is canonical for product vision, authority, roadmap,
  and operating rules.
- [PLAN.md](PLAN.md) and [plans/](plans/README.md) define the mechanical proof
  contracts.

Passing evidence is the authority for implemented behavior. Generated demos
help people inspect that evidence; they do not replace it.
