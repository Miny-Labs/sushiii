package com.sushiii.shared_data.validations

import cats.syntax.all._
import com.sushiii.shared_data.CalculatedState
import com.sushiii.shared_data.types.PolicyVersion

object PolicyVersionValidator {
  sealed trait ValidationError
  case class DuplicatePolicyVersion(policyId: String, version: String) extends ValidationError
  case class DuplicateContentHash(policyId: String, contentHash: String) extends ValidationError
  case class InvalidJurisdiction(jurisdiction: String) extends ValidationError
  case class InvalidTimestamp(timestamp: String) extends ValidationError
  case class InvalidContentHash(contentHash: String) extends ValidationError
  case class InvalidURI(uri: String) extends ValidationError
  case class InvalidPolicyId(policyId: String) extends ValidationError
  case class InvalidVersion(version: String) extends ValidationError

  private val validJurisdictions = Set(
    "US", "GB", "IN", "DE", "FR", "CA", "AU", "JP", "CN", "BR",
    "MX", "IT", "ES", "NL", "SE", "NO", "DK", "FI", "CH", "AT"
  )

  def validate(
      policyVersion: PolicyVersion,
      state: CalculatedState
  ): Either[ValidationError, Unit] = {
    for {
      _ <- validatePolicyId(policyVersion)
      _ <- validateVersion(policyVersion)
      _ <- validateContentHash(policyVersion)
      _ <- validateURI(policyVersion)
      _ <- validateNoDuplicateVersion(policyVersion, state)
      _ <- validateNoDuplicateContentHash(policyVersion, state)
      _ <- validateJurisdiction(policyVersion)
      _ <- validateTimestamp(policyVersion)
    } yield ()
  }

  private def validatePolicyId(policyVersion: PolicyVersion): Either[ValidationError, Unit] = {
    if (policyVersion.policy_id.isEmpty || policyVersion.policy_id.length > 100) {
      Left(InvalidPolicyId(policyVersion.policy_id))
    } else {
      Right(())
    }
  }

  private def validateVersion(policyVersion: PolicyVersion): Either[ValidationError, Unit] = {
    // Validate semantic versioning pattern: x.y.z
    val versionPattern = """^\d+\.\d+\.\d+$""".r
    if (versionPattern.matches(policyVersion.version)) {
      Right(())
    } else {
      Left(InvalidVersion(policyVersion.version))
    }
  }

  private def validateContentHash(policyVersion: PolicyVersion): Either[ValidationError, Unit] = {
    // Must be exactly 64 characters (SHA-256 hex)
    val hashPattern = """^[a-f0-9]{64}$""".r
    if (hashPattern.matches(policyVersion.content_hash)) {
      Right(())
    } else {
      Left(InvalidContentHash(policyVersion.content_hash))
    }
  }

  private def validateURI(policyVersion: PolicyVersion): Either[ValidationError, Unit] = {
    try {
      val uri = new java.net.URI(policyVersion.uri)
      if (uri.getScheme == "https" || uri.getScheme == "http") {
        Right(())
      } else {
        Left(InvalidURI(policyVersion.uri))
      }
    } catch {
      case _: Exception => Left(InvalidURI(policyVersion.uri))
    }
  }

  private def validateNoDuplicateVersion(
      policyVersion: PolicyVersion,
      state: CalculatedState
  ): Either[ValidationError, Unit] = {
    val key = s"${policyVersion.policy_id}:${policyVersion.version}"
    if (state.policyVersions.contains(key)) {
      Left(DuplicatePolicyVersion(policyVersion.policy_id, policyVersion.version))
    } else {
      Right(())
    }
  }

  private def validateNoDuplicateContentHash(
      policyVersion: PolicyVersion,
      state: CalculatedState
  ): Either[ValidationError, Unit] = {
    val existingWithSameHash = state.policyVersions.values.find { pv =>
      pv.policy_id == policyVersion.policy_id && pv.content_hash == policyVersion.content_hash
    }
    existingWithSameHash match {
      case Some(_) => Left(DuplicateContentHash(policyVersion.policy_id, policyVersion.content_hash))
      case None    => Right(())
    }
  }

  private def validateJurisdiction(policyVersion: PolicyVersion): Either[ValidationError, Unit] = {
    if (validJurisdictions.contains(policyVersion.jurisdiction)) {
      Right(())
    } else {
      Left(InvalidJurisdiction(policyVersion.jurisdiction))
    }
  }

  private def validateTimestamp(policyVersion: PolicyVersion): Either[ValidationError, Unit] = {
    try {
      java.time.Instant.parse(policyVersion.effective_from)
      Right(())
    } catch {
      case _: Exception => Left(InvalidTimestamp(policyVersion.effective_from))
    }
  }
}
