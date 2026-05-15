import { Router } from "express";
import { z } from "zod";
import { createHash } from "crypto";

const router = Router();

const RoleSchema = z.enum(["student", "educator", "parent"]);
const TierSchema = z.enum(["free", "pro", "pro_plus", "developer"]);

const EntitlementsByTier = {
  free: {
    can_use_pdf: false,
    can_view_diagnostics: false,
    can_use_practice: true,
    can_use_advanced_models: false,
    can_use_hindi: false,
    can_use_abstract: false,
    can_access_dashboard: true,
    can_multi_model: false,
    can_export_sessions: false,
    can_custom_prompt: false,
    can_bulk_pdf: false,
    can_dev_panel: false,
    query_limit: 5,
  },
  pro: {
    can_use_pdf: true,
    can_view_diagnostics: true,
    can_use_practice: true,
    can_use_advanced_models: true,
    can_use_hindi: true,
    can_use_abstract: true,
    can_access_dashboard: true,
    can_multi_model: false,
    can_export_sessions: false,
    can_custom_prompt: false,
    can_bulk_pdf: false,
    can_dev_panel: false,
    query_limit: -1,
  },
  pro_plus: {
    can_use_pdf: true,
    can_view_diagnostics: true,
    can_use_practice: true,
    can_use_advanced_models: true,
    can_use_hindi: true,
    can_use_abstract: true,
    can_access_dashboard: true,
    can_multi_model: true,
    can_export_sessions: true,
    can_custom_prompt: true,
    can_bulk_pdf: false,
    can_dev_panel: false,
    query_limit: -1,
  },
  developer: {
    can_use_pdf: true,
    can_view_diagnostics: true,
    can_use_practice: true,
    can_use_advanced_models: true,
    can_use_hindi: true,
    can_use_abstract: true,
    can_access_dashboard: true,
    can_multi_model: true,
    can_export_sessions: true,
    can_custom_prompt: true,
    can_bulk_pdf: true,
    can_dev_panel: true,
    query_limit: -1,
  },
};

const LoginRequestSchema = z.object({
  name: z.string().optional(),
  role: RoleSchema.default("student"),
  tier: TierSchema.default("free"),
});

const UpgradeRequestSchema = z.object({
  tier: TierSchema,
});

router.post("/login", async (req, res) => {
  try {
    const { name, role, tier } = LoginRequestSchema.parse(req.body);

    const user = {
      name: name?.trim() || "Learner",
      role,
      tier,
      entitlements: EntitlementsByTier[tier],
    };

    const sessionToken = createHash("sha256")
      .update(`${user.name}:${user.role}:${tier}:${Date.now()}`)
      .digest("hex");

    return res.status(200).json({ user, sessionToken });
  } catch (error) {
    return res.status(400).json({
      error: "Invalid login request",
      message: error instanceof Error ? error.message : "Invalid request body",
    });
  }
});

router.post("/upgrade", async (req, res) => {
  try {
    const { tier } = UpgradeRequestSchema.parse(req.body);

    const user = {
      name: "Learner",
      role: "student" as const,
      tier,
      entitlements: EntitlementsByTier[tier],
    };

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(400).json({
      error: "Invalid upgrade request",
      message: error instanceof Error ? error.message : "Invalid request body",
    });
  }
});

export default router;
