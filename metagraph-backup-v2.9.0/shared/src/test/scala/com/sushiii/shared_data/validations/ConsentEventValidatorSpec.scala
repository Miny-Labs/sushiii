package com.sushiii.shared_data.validations

import com.sushiii.shared_data.CalculatedState
import com.sushiii.shared_data.types.{ConsentEvent, PolicyRef, PolicyVersion}
import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class ConsentEventValidatorSpec extends AnyFlatSpec with Matchers {

  val validPolicyVersion = PolicyVersion(
    policy_id = "privacy-policy",
    version = "1.0.0",
    content_hash = "a" * 64,
    uri = "https://example.com/policies/privacy.json",
    jurisdiction = "US",
    effective_from = "2024-01-01T00:00:00Z"
  )

  val stateWithPolicy = CalculatedState.empty.addPolicyVersion(validPolicyVersion)

  "ConsentEventValidator" should "accept valid consent event" in {
    val validConsent = ConsentEvent(
      subject_id = "b" * 64, // 64 hex chars (hashed PII)
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = "1.0.0"
      ),
      event_type = "consent_granted",
      timestamp = "2024-01-15T12:00:00Z",
      metadata = Map.empty
    )

    val result = ConsentEventValidator.validate(validConsent, stateWithPolicy)
    result should be(Right(()))
  }

  it should "reject consent with invalid subject_id format" in {
    val invalidConsent = ConsentEvent(
      subject_id = "invalid", // Not 64 hex chars
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = "1.0.0"
      ),
      event_type = "consent_granted",
      timestamp = "2024-01-15T12:00:00Z",
      metadata = Map.empty
    )

    val result = ConsentEventValidator.validate(invalidConsent, stateWithPolicy)
    result should be(Left(ConsentEventValidator.InvalidSubjectId("invalid")))
  }

  it should "reject consent with empty policy_id" in {
    val invalidConsent = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "",
        version = "1.0.0"
      ),
      event_type = "consent_granted",
      timestamp = "2024-01-15T12:00:00Z",
      metadata = Map.empty
    )

    val result = ConsentEventValidator.validate(invalidConsent, stateWithPolicy)
    result should be(Left(ConsentEventValidator.InvalidPolicyRef("policy_id cannot be empty")))
  }

  it should "reject consent with empty version" in {
    val invalidConsent = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = ""
      ),
      event_type = "consent_granted",
      timestamp = "2024-01-15T12:00:00Z",
      metadata = Map.empty
    )

    val result = ConsentEventValidator.validate(invalidConsent, stateWithPolicy)
    result should be(Left(ConsentEventValidator.InvalidPolicyRef("version cannot be empty")))
  }

  it should "reject consent with invalid version format" in {
    val invalidConsent = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = "v1.0" // Invalid semver
      ),
      event_type = "consent_granted",
      timestamp = "2024-01-15T12:00:00Z",
      metadata = Map.empty
    )

    val result = ConsentEventValidator.validate(invalidConsent, stateWithPolicy)
    result should be(Left(ConsentEventValidator.InvalidPolicyRef("invalid version format: v1.0")))
  }

  it should "reject consent with invalid event_type" in {
    val invalidConsent = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = "1.0.0"
      ),
      event_type = "invalid_type",
      timestamp = "2024-01-15T12:00:00Z",
      metadata = Map.empty
    )

    val result = ConsentEventValidator.validate(invalidConsent, stateWithPolicy)
    result should be(Left(ConsentEventValidator.InvalidEventType("invalid_type")))
  }

  it should "accept all valid event types" in {
    val validEventTypes = List("consent_granted", "consent_withdrawn", "consent_updated")

    validEventTypes.foreach { eventType =>
      val consent = ConsentEvent(
        subject_id = "b" * 64,
        policy_ref = PolicyRef(
          policy_id = "privacy-policy",
          version = "1.0.0"
        ),
        event_type = eventType,
        timestamp = "2024-01-15T12:00:00Z",
        metadata = Map.empty
      )

      val result = ConsentEventValidator.validate(consent, stateWithPolicy)
      result should be(Right(()))
    }
  }

  it should "reject consent with future timestamp" in {
    val futureTimestamp = java.time.Instant.now().plusSeconds(3600).toString

    val invalidConsent = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = "1.0.0"
      ),
      event_type = "consent_granted",
      timestamp = futureTimestamp,
      metadata = Map.empty
    )

    val result = ConsentEventValidator.validate(invalidConsent, stateWithPolicy)
    result should be(Left(ConsentEventValidator.FutureTimestamp(futureTimestamp)))
  }

  it should "reject consent with invalid timestamp format" in {
    val invalidConsent = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = "1.0.0"
      ),
      event_type = "consent_granted",
      timestamp = "not-a-timestamp",
      metadata = Map.empty
    )

    val result = ConsentEventValidator.validate(invalidConsent, stateWithPolicy)
    result should be(Left(ConsentEventValidator.InvalidTimestamp("not-a-timestamp")))
  }

  it should "reject consent with timestamp older than 2 years" in {
    val oldTimestamp = java.time.Instant.now().minusSeconds(731 * 24 * 60 * 60).toString // 731 days ago

    val invalidConsent = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = "1.0.0"
      ),
      event_type = "consent_granted",
      timestamp = oldTimestamp,
      metadata = Map.empty
    )

    val result = ConsentEventValidator.validate(invalidConsent, stateWithPolicy)
    result should be(Left(ConsentEventValidator.TimestampTooOld(oldTimestamp)))
  }

  it should "reject consent when policy version doesn't exist" in {
    val consent = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "non-existent-policy",
        version = "1.0.0"
      ),
      event_type = "consent_granted",
      timestamp = "2024-01-15T12:00:00Z",
      metadata = Map.empty
    )

    val result = ConsentEventValidator.validate(consent, stateWithPolicy)
    result should be(Left(ConsentEventValidator.PolicyVersionNotFound("non-existent-policy", "1.0.0")))
  }

  it should "reject duplicate consent events" in {
    val consent = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = "1.0.0"
      ),
      event_type = "consent_granted",
      timestamp = "2024-01-15T12:00:00Z",
      metadata = Map.empty
    )

    // Add consent to state
    val stateWithConsent = stateWithPolicy.addConsentEvent(consent)

    // Try to add the same consent again
    val result = ConsentEventValidator.validate(consent, stateWithConsent)
    result should be(Left(ConsentEventValidator.DuplicateConsentEvent("b" * 64, "privacy-policy:1.0.0")))
  }

  it should "allow multiple different consents for same subject and policy" in {
    val consent1 = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = "1.0.0"
      ),
      event_type = "consent_granted",
      timestamp = "2024-01-15T12:00:00Z",
      metadata = Map.empty
    )

    val consent2 = ConsentEvent(
      subject_id = "b" * 64,
      policy_ref = PolicyRef(
        policy_id = "privacy-policy",
        version = "1.0.0"
      ),
      event_type = "consent_withdrawn", // Different event type
      timestamp = "2024-01-16T12:00:00Z", // Different timestamp
      metadata = Map.empty
    )

    val stateWithConsent1 = stateWithPolicy.addConsentEvent(consent1)
    val result = ConsentEventValidator.validate(consent2, stateWithConsent1)

    result should be(Right(()))
  }
}
