package com.sushiii.shared_data.types

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}

case class PolicyRef(policy_id: String, version: String)

object PolicyRef {
  implicit val encoder: Encoder[PolicyRef] = deriveEncoder[PolicyRef]
  implicit val decoder: Decoder[PolicyRef] = deriveDecoder[PolicyRef]
}

case class ConsentEvent(
    subject_id: String,
    policy_ref: PolicyRef,
    event_type: String,
    timestamp: String,
    captured_at: String
)

object ConsentEvent {
  implicit val encoder: Encoder[ConsentEvent] = deriveEncoder[ConsentEvent]
  implicit val decoder: Decoder[ConsentEvent] = deriveDecoder[ConsentEvent]
}
