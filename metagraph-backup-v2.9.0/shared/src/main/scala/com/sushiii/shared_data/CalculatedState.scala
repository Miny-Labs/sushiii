package com.sushiii.shared_data

import com.sushiii.shared_data.types.{ConsentEvent, PolicyVersion}
import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}

/**
 * Metadata about the calculated state
 */
case class StateMetadata(
    totalPolicyVersions: Int = 0,
    totalConsentEvents: Int = 0,
    totalActiveConsents: Int = 0,
    lastUpdatedAt: String = java.time.Instant.now().toString,
    stateVersion: Long = 0L
)

object StateMetadata {
  implicit val encoder: Encoder[StateMetadata] = deriveEncoder[StateMetadata]
  implicit val decoder: Decoder[StateMetadata] = deriveDecoder[StateMetadata]
}

/**
 * Enhanced CalculatedState with indices and metadata for efficient queries
 */
case class CalculatedState(
    // Core data
    policyVersions: Map[String, PolicyVersion] = Map.empty,
    consentEvents: List[ConsentEvent] = List.empty,

    // Indices for fast lookups
    consentsBySubject: Map[String, List[ConsentEvent]] = Map.empty,
    consentsByPolicy: Map[String, List[ConsentEvent]] = Map.empty,

    // Active consents: latest consent for each subject+policy combination
    // Key: "subject_id:policy_id:policy_version"
    activeConsents: Map[String, ConsentEvent] = Map.empty,

    // Metadata
    metadata: StateMetadata = StateMetadata()
) {

  /**
   * Add a new policy version and rebuild indices
   */
  def addPolicyVersion(policyVersion: PolicyVersion): CalculatedState = {
    val key = s"${policyVersion.policy_id}:${policyVersion.version}"
    val newPolicyVersions = policyVersions + (key -> policyVersion)

    this.copy(
      policyVersions = newPolicyVersions,
      metadata = metadata.copy(
        totalPolicyVersions = newPolicyVersions.size,
        lastUpdatedAt = java.time.Instant.now().toString,
        stateVersion = metadata.stateVersion + 1
      )
    )
  }

  /**
   * Add a new consent event and rebuild indices
   */
  def addConsentEvent(consentEvent: ConsentEvent): CalculatedState = {
    val newConsentEvents = consentEvents :+ consentEvent

    // Update subject index
    val subjectConsents = consentsBySubject.getOrElse(consentEvent.subject_id, List.empty)
    val newConsentsBySubject = consentsBySubject + (consentEvent.subject_id -> (subjectConsents :+ consentEvent))

    // Update policy index
    val policyKey = s"${consentEvent.policy_ref.policy_id}:${consentEvent.policy_ref.version}"
    val policyConsents = consentsByPolicy.getOrElse(policyKey, List.empty)
    val newConsentsByPolicy = consentsByPolicy + (policyKey -> (policyConsents :+ consentEvent))

    // Update active consents (keep only the most recent consent for each subject+policy)
    val activeKey = s"${consentEvent.subject_id}:${policyKey}"
    val existingActive = activeConsents.get(activeKey)
    val newActiveConsents = existingActive match {
      case Some(existing) =>
        // Compare timestamps - keep the newer one
        try {
          val existingTime = java.time.Instant.parse(existing.timestamp)
          val newTime = java.time.Instant.parse(consentEvent.timestamp)
          if (newTime.isAfter(existingTime)) {
            activeConsents + (activeKey -> consentEvent)
          } else {
            activeConsents
          }
        } catch {
          case _: Exception => activeConsents + (activeKey -> consentEvent)
        }
      case None =>
        activeConsents + (activeKey -> consentEvent)
    }

    this.copy(
      consentEvents = newConsentEvents,
      consentsBySubject = newConsentsBySubject,
      consentsByPolicy = newConsentsByPolicy,
      activeConsents = newActiveConsents,
      metadata = metadata.copy(
        totalConsentEvents = newConsentEvents.size,
        totalActiveConsents = newActiveConsents.size,
        lastUpdatedAt = java.time.Instant.now().toString,
        stateVersion = metadata.stateVersion + 1
      )
    )
  }

  /**
   * Get all consents for a subject
   */
  def getConsentsBySubject(subjectId: String): List[ConsentEvent] = {
    consentsBySubject.getOrElse(subjectId, List.empty)
  }

  /**
   * Get all consents for a policy version
   */
  def getConsentsByPolicy(policyId: String, version: String): List[ConsentEvent] = {
    val key = s"$policyId:$version"
    consentsByPolicy.getOrElse(key, List.empty)
  }

  /**
   * Get the active consent for a subject+policy combination
   */
  def getActiveConsent(subjectId: String, policyId: String, version: String): Option[ConsentEvent] = {
    val key = s"$subjectId:$policyId:$version"
    activeConsents.get(key)
  }

  /**
   * Check if a subject has active consent for a policy
   */
  def hasActiveConsent(subjectId: String, policyId: String, version: String): Boolean = {
    getActiveConsent(subjectId, policyId, version) match {
      case Some(consent) => consent.event_type == "consent_granted"
      case None => false
    }
  }
}

object CalculatedState {
  implicit val encoder: Encoder[CalculatedState] = deriveEncoder[CalculatedState]
  implicit val decoder: Decoder[CalculatedState] = deriveDecoder[CalculatedState]

  val empty: CalculatedState = CalculatedState()

  /**
   * Rebuild indices from raw data (useful after deserialization)
   */
  def rebuildIndices(state: CalculatedState): CalculatedState = {
    var rebuilt = CalculatedState(
      policyVersions = state.policyVersions,
      consentEvents = List.empty
    )

    // Rebuild by adding each consent event
    state.consentEvents.foreach { consent =>
      rebuilt = rebuilt.addConsentEvent(consent)
    }

    rebuilt
  }
}
