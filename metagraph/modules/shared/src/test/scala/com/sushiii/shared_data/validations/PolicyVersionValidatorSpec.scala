package com.sushiii.shared_data.validations

import com.sushiii.shared_data.CalculatedState
import com.sushiii.shared_data.types.PolicyVersion
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class PolicyVersionValidatorSpec extends AnyFlatSpec with Matchers {

  "PolicyVersionValidator" should "accept valid policy version" in {
    val validPolicy = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.0.0",
      content_hash = "a" * 64, // 64 hex chars
      uri = "https://example.com/policies/privacy-v1.json",
      jurisdiction = "US",
      effective_from = "2024-01-01T00:00:00Z"
    )

    val state = CalculatedState.empty

    val result = PolicyVersionValidator.validate(validPolicy, state)
    result should be(Right(()))
  }

  it should "reject policy with empty policy_id" in {
    val invalidPolicy = PolicyVersion(
      policy_id = "",
      version = "1.0.0",
      content_hash = "a" * 64,
      uri = "https://example.com/policies/privacy.json",
      jurisdiction = "US",
      effective_from = "2024-01-01T00:00:00Z"
    )

    val state = CalculatedState.empty

    val result = PolicyVersionValidator.validate(invalidPolicy, state)
    result should be(Left(PolicyVersionValidator.InvalidPolicyId("")))
  }

  it should "reject policy with invalid semantic version" in {
    val invalidPolicy = PolicyVersion(
      policy_id = "privacy-policy",
      version = "v1.0", // Invalid semver
      content_hash = "a" * 64,
      uri = "https://example.com/policies/privacy.json",
      jurisdiction = "US",
      effective_from = "2024-01-01T00:00:00Z"
    )

    val state = CalculatedState.empty

    val result = PolicyVersionValidator.validate(invalidPolicy, state)
    result should be(Left(PolicyVersionValidator.InvalidVersion("v1.0")))
  }

  it should "reject policy with invalid content hash length" in {
    val invalidPolicy = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.0.0",
      content_hash = "abc123", // Too short
      uri = "https://example.com/policies/privacy.json",
      jurisdiction = "US",
      effective_from = "2024-01-01T00:00:00Z"
    )

    val state = CalculatedState.empty

    val result = PolicyVersionValidator.validate(invalidPolicy, state)
    result should be(Left(PolicyVersionValidator.InvalidContentHash("abc123")))
  }

  it should "reject policy with invalid content hash characters" in {
    val invalidPolicy = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.0.0",
      content_hash = "g" * 64, // 'g' is not a hex char
      uri = "https://example.com/policies/privacy.json",
      jurisdiction = "US",
      effective_from = "2024-01-01T00:00:00Z"
    )

    val state = CalculatedState.empty

    val result = PolicyVersionValidator.validate(invalidPolicy, state)
    result should be(Left(PolicyVersionValidator.InvalidContentHash("g" * 64)))
  }

  it should "reject policy with invalid URI scheme" in {
    val invalidPolicy = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.0.0",
      content_hash = "a" * 64,
      uri = "ftp://example.com/policies/privacy.json", // ftp not allowed
      jurisdiction = "US",
      effective_from = "2024-01-01T00:00:00Z"
    )

    val state = CalculatedState.empty

    val result = PolicyVersionValidator.validate(invalidPolicy, state)
    result should be(Left(PolicyVersionValidator.InvalidURI("ftp://example.com/policies/privacy.json")))
  }

  it should "reject policy with invalid jurisdiction" in {
    val invalidPolicy = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.0.0",
      content_hash = "a" * 64,
      uri = "https://example.com/policies/privacy.json",
      jurisdiction = "XX", // Invalid jurisdiction
      effective_from = "2024-01-01T00:00:00Z"
    )

    val state = CalculatedState.empty

    val result = PolicyVersionValidator.validate(invalidPolicy, state)
    result should be(Left(PolicyVersionValidator.InvalidJurisdiction("XX")))
  }

  it should "reject policy with invalid timestamp" in {
    val invalidPolicy = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.0.0",
      content_hash = "a" * 64,
      uri = "https://example.com/policies/privacy.json",
      jurisdiction = "US",
      effective_from = "not-a-timestamp"
    )

    val state = CalculatedState.empty

    val result = PolicyVersionValidator.validate(invalidPolicy, state)
    result should be(Left(PolicyVersionValidator.InvalidTimestamp("not-a-timestamp")))
  }

  it should "reject duplicate policy version" in {
    val policy = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.0.0",
      content_hash = "a" * 64,
      uri = "https://example.com/policies/privacy.json",
      jurisdiction = "US",
      effective_from = "2024-01-01T00:00:00Z"
    )

    // State already contains this policy version
    val state = CalculatedState.empty.addPolicyVersion(policy)

    val result = PolicyVersionValidator.validate(policy, state)
    result should be(Left(PolicyVersionValidator.DuplicatePolicyVersion("privacy-policy", "1.0.0")))
  }

  it should "reject duplicate content hash for same policy" in {
    val policy1 = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.0.0",
      content_hash = "a" * 64,
      uri = "https://example.com/policies/privacy-v1.json",
      jurisdiction = "US",
      effective_from = "2024-01-01T00:00:00Z"
    )

    val policy2 = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.1.0",
      content_hash = "a" * 64, // Same content hash
      uri = "https://example.com/policies/privacy-v1-1.json",
      jurisdiction = "US",
      effective_from = "2024-02-01T00:00:00Z"
    )

    val state = CalculatedState.empty.addPolicyVersion(policy1)

    val result = PolicyVersionValidator.validate(policy2, state)
    result should be(Left(PolicyVersionValidator.DuplicateContentHash("privacy-policy", "a" * 64)))
  }

  it should "accept different versions of the same policy with different content hashes" in {
    val policy1 = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.0.0",
      content_hash = "a" * 64,
      uri = "https://example.com/policies/privacy-v1.json",
      jurisdiction = "US",
      effective_from = "2024-01-01T00:00:00Z"
    )

    val policy2 = PolicyVersion(
      policy_id = "privacy-policy",
      version = "1.1.0",
      content_hash = "b" * 64, // Different content hash
      uri = "https://example.com/policies/privacy-v1-1.json",
      jurisdiction = "US",
      effective_from = "2024-02-01T00:00:00Z"
    )

    val state = CalculatedState.empty.addPolicyVersion(policy1)

    val result = PolicyVersionValidator.validate(policy2, state)
    result should be(Right(()))
  }
}
