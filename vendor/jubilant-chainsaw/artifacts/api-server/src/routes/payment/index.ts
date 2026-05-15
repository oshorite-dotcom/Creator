import { Router } from "express";
import { z } from "zod";
import { createHash } from "crypto";

const router = Router();

const TierSchema = z.enum(["free", "pro", "pro_plus", "developer"]);

const CheckoutSessionRequestSchema = z.object({
  tier: TierSchema,
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

router.post("/checkout-session", async (req, res) => {
  try {
    const { tier, successUrl, cancelUrl } = CheckoutSessionRequestSchema.parse(req.body);

    const sessionId = createHash("sha256")
      .update(`${tier}:${Date.now()}`)
      .digest("hex");

    const checkoutUrl = successUrl
      ? successUrl
      : `https://example.com/checkout/${sessionId}?tier=${tier}`;

    return res.status(200).json({
      tier,
      sessionId,
      checkoutUrl,
      status: "created",
    });
  } catch (error) {
    return res.status(400).json({
      error: "Invalid checkout session request",
      message: error instanceof Error ? error.message : "Invalid request body",
    });
  }
});

export default router;
