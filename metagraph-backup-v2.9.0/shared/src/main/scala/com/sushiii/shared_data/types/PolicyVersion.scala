package com.sushiii.shared_data.types

import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}

case class PolicyVersion(
    policy_id: String,
    version: String,
    content_hash: String,
    uri: String,
    jurisdiction: String,
    effective_from: String,
    created_at: String
)

object PolicyVersion {
  implicit val encoder: Encoder[PolicyVersion] = deriveEncoder[PolicyVersion]
  implicit val decoder: Decoder[PolicyVersion] = deriveDecoder[PolicyVersion]
}
