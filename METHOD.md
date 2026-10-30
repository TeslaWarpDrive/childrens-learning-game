# Lucy likeness method (reconstructed 2026-10-30)

## Evidence: ElevenLabs flow KkrAH8VuvhTLoNtMbFE7 (read via creative_get_flow / get_flow_node)
- 5 approved edits (keep pile 07-11) = nodes R5iKkirsfL0UpyGWscw5 (mailbox), lCoOEZ4kBhExNvRep4cC, sbKPuoyvvvInOIGS6WIX, twPHWVa2ecuYJ3fe7BNo, KdM2E6veqR1gbaKuuGWz (head-tilt), generated 2026-10-18 ~07:48 UTC (~2:48 am CT).
- Model: bytedance-seedream-5-lite. Params: aspect_ratio 16:9, resolution 2K (out 2560x1440). No seed param exists.
- References: ONE image only — static asset node QKLVIYxlJJQptXkoqk1q (asset BdxRVUbAalVDNhJI5wX7, 1280x720) = the locked garden-B Lucy (/workspace/lucy-anchor/lucy-locked-garden-b.jpg), wired into the `images` port. The keep pile did not exist yet, so 10/18 used fewer refs than the current skill requires.
- Cost ~212 credits/image (memory: 5-image batch ~1,060 credits).
- Exact prompt pattern (mailbox, node R5i...):
  > "Edit the reference image. KEEP exactly unchanged: this golden retriever puppy Lucy's face, eyes, nose, fur color and texture, ears, age, body size, proportions, smile, and the soft realistic 3D animated film render style. No collar, no accessories, no orange tint, not a photograph. CHANGE only the setting and pose: Lucy sits proudly beside a bright red classroom mailbox ..."
- Head-tilt (KdM..., "extremely good"): same KEEP block, CHANGE: "close-up of Lucy sitting and tilting her head to one side with a curious, gentle, encouraging expression ... soft pastel classroom background gently blurred."

## Lessons (memory)
- Bradley 10/18: mailbox + classroom wave near-perfect; leap close; moonboat sleep read younger/rounder; head-tilt drifted slightly yet he loved it.
- Never cross-eyed; ignore bows/clips; never draw her fresh from a description; Krea Flux Kontext "not quite Lucy" (10/23).

## Method now (skill lucy-image-keep-pile)
Same model/prompt pattern, but refs = full keep pile 01-11 + edit base (12 images) on the `images` port.

## BLOCKER (2026-10-30 ~6:20 pm CT)
Seedream 5 Lite rejects >10 reference images ("can only reference up to ten images, got 11"). Full pile 01-11 + edit base = 12. Per skill + brief, did not pick a subset; no generation run, 0 credits spent.
Refs are staged on flow yuQAe0hoTg2oErjfSE3P (edit base node 8CaBXpDn9dgq3Yv95hAW + 01-11 nodes). Draft prompt: test1/prompt.txt.
Options: (a) Bradley approves a 10-ref subset, e.g. edit base + 01,02,03,04 + 07-11 (drop trots 05-06, which README says are "not references"); (b) 10/18 original: edit base only; (c) a model that takes more refs (none listed above 10 here).
