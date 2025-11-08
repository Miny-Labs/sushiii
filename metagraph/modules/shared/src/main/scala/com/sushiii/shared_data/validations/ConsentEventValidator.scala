package com.sushiii.shared_data.validations

import cats.syntax.all._
import com.sushiii.shared_data.CalculatedState
import com.sushiii.shared_data.types.ConsentEvent

object ConsentEventValidator {
  sealed trait ValidationError
  case class PolicyVersionNotFound(policyId: String, version: String) extends ValidationError
  case class FutureTimestamp(timestamp: String) extends ValidationError
  case class InvalidSubjectId(subjectId: String) extends ValidationError
  case class InvalidTimestamp(timestamp: String) extends ValidationError
  case class TimestampTooOld(timestamp: String) extends ValidationError
  case class InvalidEventType(eventType: String) extends ValidationError
  case class DuplicateConsentEvent(subjectId: String, policyRef: String) extends ValidationError
  case class InvalidPolicyRef(reason: String) extends ValidationError

  private val validEventTypes = Set(
    "consent_granted",
    "consent_withdrawn",
    "consent_updated"
  )

  // Maximum age for consent events: 2 years
  private val maxEventAge = java.time.Duration.ofDays(730)

  def validate(
      consentEvent: ConsentEvent,
      state: CalculatedState
  ): Either[ValidationError, Unit] = {
    for {
      _ <- validateSubjectId(consentEvent)
      _ <- validatePolicyRef(consentEvent)
      _ <- validateEventType(consentEvent)
      _ <- validateTimestamp(consentEvent)
      _ <- validatePolicyVersionExists(consentEvent, state)
      _ <- validateNoDuplicate(consentEvent, state)
    } yield ()
  }

  private def validatePolicyVersionExists(
      consentEvent: ConsentEvent,
      state: CalculatedState
  ): Either[ValidationError, Unit] = {
    val key = s"${consentEvent.policy_ref.policy_id}:${consentEvent.policy_ref.version}"
    if (state.policyVersions.contains(key)) {
      Right(())
    } else {
      Left(PolicyVersionNotFound(consentEvent.policy_ref.policy_id, consentEvent.policy_ref.version))
    }
  }

  private def validateSubjectId(consentEvent: ConsentEvent): Either[ValidationError, Unit] = {
    val subjectId = consentEvent.subject_id
    // Must be exactly 64 hex characters (SHA-256 hash of PII)
    if (subjectId.matches("^[a-f0-9]{64}$")) {
      Right(())
    } else {
      Left(InvalidSubjectId(subjectId))
    }
  }

  private def validatePolicyRef(consentEvent: ConsentEvent): Either[ValidationError, Unit] = {
    val policyRef = consentEvent.policy_ref
    if (policyRef.policy_id.isEmpty) {
      Left(InvalidPolicyRef("policy_id cannot be empty"))
    } else if (policyRef.version.isEmpty) {
      Left(InvalidPolicyRef("version cannot be empty"))
    } else if (policyRef.policy_id.length > 100) {
      Left(InvalidPolicyRef("policy_id too long (max 100 chars)"))
    } else {
      // Validate semantic versioning pattern
      val versionPattern = """^\d+\.\d+\.\d+$""".r
      if (versionPattern.matches(policyRef.version)) {
        Right(())
      } else {
        Left(InvalidPolicyRef(s"invalid version format: ${policyRef.version}"))
      }
    }
  }

  private def validateEventType(consentEvent: ConsentEvent): Either[ValidationError, Unit] = {
    if (validEventTypes.contains(consentEvent.event_type)) {
      Right(())
    } else {
      Left(InvalidEventType(consentEvent.event_type))
    }
  }

  private def validateTimestamp(consentEvent: ConsentEvent): Either[ValidationError, Unit] = {
    try {
      val eventTime = java.time.Instant.parse(consentEvent.timestamp)
      val now = java.time.Instant.now()

      // Check not in future
      if (eventTime.isAfter(now)) {
        Left(FutureTimestamp(consentEvent.timestamp))
      }
      // Check not too old (older than 2 years)
      else if (java.time.Duration.between(eventTime, now).compareTo(maxEventAge) > 0) {
        Left(TimestampTooOld(consentEvent.timestamp))
      }
      else {
        Right(())
      }
    } catch {
      case _: Exception => Left(InvalidTimestamp(consentEvent.timestamp))
    }
  }

  private def validateNoDuplicate(
      consentEvent: ConsentEvent,
      state: CalculatedState
  ): Either[ValidationError, Unit] = {
    // Check for exact duplicate: same subject_id, policy_ref, event_type, and timestamp
    val isDuplicate = state.consentEvents.exists { existing =>
      existing.subject_id == consentEvent.subject_id &&
      existing.policy_ref.policy_id == consentEvent.policy_ref.policy_id &&
      existing.policy_ref.version == consentEvent.policy_ref.version &&
      existing.event_type == consentEvent.event_type &&
      existing.timestamp == consentEvent.timestamp
    }

    if (isDuplicate) {
      val policyRef = s"${consentEvent.policy_ref.policy_id}:${consentEvent.policy_ref.version}"
      Left(DuplicateConsentEvent(consentEvent.subject_id, policyRef))
    } else {
      Right(())
    }
  }
}
