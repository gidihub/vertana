import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  PERMISSION_KEYS,
  can,
  canViewSharedResource,
  canViewTest,
  defaultPermissionsForRole,
  type PermissionContext,
  type PermissionKey,
} from "./permissions.ts"

function ctx(
  roleId: PermissionContext["roleId"],
  overrides?: Partial<PermissionContext>,
): PermissionContext {
  const permissions = defaultPermissionsForRole(roleId)
  return {
    roleId,
    permissions,
    scopes: {
      assessment_view_scope:
        roleId === "recruiter" || roleId === "hiring_manager"
          ? "assigned"
          : roleId === "reviewer"
            ? "assigned"
            : "all",
      reviewer_scope: roleId === "reviewer" ? "shared" : "all",
    },
    ...overrides,
  }
}

describe("can()", () => {
  it("locked roles always pass", () => {
    const owner = ctx("owner")
    for (const key of PERMISSION_KEYS) {
      assert.equal(can(owner, key), true)
    }
  })

  it("billing manager only has settings.billing by default", () => {
    const billing = ctx("billing_manager")
    assert.equal(can(billing, "settings.billing"), true)
    assert.equal(can(billing, "candidates.grade"), false)
    assert.equal(can(billing, "tests.view_library"), false)
    assert.equal(can(billing, "media.view"), false)
  })

  it("recruiter defaults deny media.view but allow grading", () => {
    const recruiter = ctx("recruiter")
    assert.equal(can(recruiter, "media.view"), false)
    assert.equal(can(recruiter, "candidates.grade"), true)
    assert.equal(can(recruiter, "tests.delete"), false)
    assert.equal(can(recruiter, "tests.create"), true)
  })

  it("revoking a permission blocks immediately", () => {
    const recruiter = ctx("recruiter")
    recruiter.permissions["candidates.grade"] = false
    assert.equal(can(recruiter, "candidates.grade"), false)
  })
})

describe("canViewTest()", () => {
  const assigned = new Set(["test-a"])

  it("hiring manager sees only assigned tests", () => {
    const hm = ctx("hiring_manager")
    assert.equal(
      canViewTest(hm, {
        testId: "test-a",
        createdBy: "other",
        userId: "hm-1",
        assignedTestIds: assigned,
      }),
      true,
    )
    assert.equal(
      canViewTest(hm, {
        testId: "test-b",
        createdBy: "other",
        userId: "hm-1",
        assignedTestIds: assigned,
      }),
      false,
    )
  })

  it("recruiter with all scope sees tests when they have view permission", () => {
    const recruiter = ctx("recruiter", {
      scopes: { assessment_view_scope: "all", reviewer_scope: "shared" },
    })
    assert.equal(
      canViewTest(recruiter, {
        testId: "test-b",
        createdBy: "other",
        userId: "rec-1",
        assignedTestIds: assigned,
      }),
      true,
    )
  })

  it("billing manager never sees tests", () => {
    const billing = ctx("billing_manager")
    assert.equal(
      canViewTest(billing, {
        testId: "test-a",
        createdBy: null,
        userId: "bill-1",
        assignedTestIds: assigned,
      }),
      false,
    )
  })
})

describe("canViewSharedResource()", () => {
  it("reviewer in shared scope sees only shared attempts", () => {
    const reviewer = ctx("reviewer")
    const sharedTests = new Set<string>()
    const sharedAttempts = new Set(["attempt-1"])

    assert.equal(
      canViewSharedResource(reviewer, {
        sharedTestIds: sharedTests,
        sharedAttemptIds: sharedAttempts,
        attemptId: "attempt-1",
      }),
      true,
    )
    assert.equal(
      canViewSharedResource(reviewer, {
        sharedTestIds: sharedTests,
        sharedAttemptIds: sharedAttempts,
        attemptId: "attempt-2",
      }),
      false,
    )
  })

  it("reviewer in all scope sees every attempt", () => {
    const reviewer = ctx("reviewer", {
      scopes: { assessment_view_scope: "assigned", reviewer_scope: "all" },
    })
    assert.equal(
      canViewSharedResource(reviewer, {
        sharedTestIds: new Set(),
        sharedAttemptIds: new Set(),
        attemptId: "attempt-99",
      }),
      true,
    )
  })

  it("roles with all visibility scope are not filtered by shares", () => {
    const recruiter = ctx("recruiter")
    assert.equal(
      canViewSharedResource(recruiter, {
        sharedTestIds: new Set(),
        sharedAttemptIds: new Set(),
        attemptId: "attempt-99",
      }),
      true,
    )
  })

  it("roles with shared visibility scope require explicit shares", () => {
    const recruiter = ctx("recruiter", {
      scopes: { assessment_view_scope: "assigned", reviewer_scope: "shared" },
    })
    assert.equal(
      canViewSharedResource(recruiter, {
        sharedTestIds: new Set(),
        sharedAttemptIds: new Set(),
        attemptId: "attempt-99",
      }),
      false,
    )
  })
})

describe("defaultPermissionsForRole()", () => {
  it("hiring manager has media.view ON by default", () => {
    const perms = defaultPermissionsForRole("hiring_manager")
    assert.equal(perms["media.view"], true)
    assert.equal(perms["settings.billing"], false)
  })

  it("every permission key is explicit for configurable roles", () => {
    for (const roleId of [
      "hiring_manager",
      "recruiter",
      "reviewer",
      "billing_manager",
    ] as const) {
      const perms = defaultPermissionsForRole(roleId)
      for (const key of PERMISSION_KEYS) {
        assert.equal(typeof perms[key as PermissionKey], "boolean")
      }
    }
  })
})
