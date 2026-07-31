import { getDream } from "@/lib/dreams";

/**
 * Mock checkout.
 *
 * Deliberately fake — no money moves and no Stripe key is involved. The Buy
 * button is styled as Stripe's because that's the intended destination: to make
 * this real, swap the body below for a Stripe Checkout Session and return
 * `{ url }` for the client to redirect to. Nothing else in the app needs to change.
 */
export async function POST(req: Request) {
  let dreamId: unknown;
  try {
    ({ dreamId } = await req.json());
  } catch {
    return Response.json({ error: "Expected a JSON body" }, { status: 400 });
  }

  if (typeof dreamId !== "string") {
    return Response.json({ error: "dreamId must be a string" }, { status: 400 });
  }

  const dream = getDream(dreamId);
  if (!dream) {
    return Response.json({ error: `No dream ${dreamId}` }, { status: 404 });
  }

  return Response.json({
    ok: true,
    mock: true,
    dreamId: dream.id,
    amount: dream.price * 100,
    currency: "usd",
    receipt: `mock_${dream.id}`,
  });
}
