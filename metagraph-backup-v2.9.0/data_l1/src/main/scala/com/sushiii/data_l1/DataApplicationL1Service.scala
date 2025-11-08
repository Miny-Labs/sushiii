package com.sushiii.data_l1

import cats.effect.{Async, Resource}
import cats.syntax.all._
import com.sushiii.shared_data.CalculatedState
import com.sushiii.shared_data.types.{ConsentEvent, PolicyVersion}
import com.sushiii.shared_data.validations.{ConsentEventValidator, PolicyVersionValidator}
import io.circe.{Decoder, Encoder}
import io.circe.generic.semiauto.{deriveDecoder, deriveEncoder}
import io.circe.syntax._
import io.circe.parser.decode
import org.http4s._
import org.http4s.circe._
import org.http4s.dsl.Http4sDsl
import org.tessellation.currency.dataApplication.{BaseDataApplicationL1Service, DataApplicationValidationError}
import org.tessellation.security.signature.Signed

object DataApplicationL1Service {
  def make[F[_]: Async]: Resource[F, BaseDataApplicationL1Service[F]] =
    Resource.pure(new DataApplicationL1Service[F])

  // Define custom data update types
  sealed trait DataUpdate
  case class PolicyVersionUpdate(data: PolicyVersion) extends DataUpdate
  case class ConsentEventUpdate(data: ConsentEvent) extends DataUpdate

  object DataUpdate {
    implicit val encoder: Encoder[DataUpdate] = Encoder.instance {
      case PolicyVersionUpdate(data) =>
        io.circe.Json.obj(
          "type" -> "PolicyVersionUpdate".asJson,
          "data" -> data.asJson
        )
      case ConsentEventUpdate(data) =>
        io.circe.Json.obj(
          "type" -> "ConsentEventUpdate".asJson,
          "data" -> data.asJson
        )
    }

    implicit val decoder: Decoder[DataUpdate] = Decoder.instance { cursor =>
      cursor.downField("type").as[String].flatMap {
        case "PolicyVersionUpdate" =>
          cursor.downField("data").as[PolicyVersion].map(PolicyVersionUpdate)
        case "ConsentEventUpdate" =>
          cursor.downField("data").as[ConsentEvent].map(ConsentEventUpdate)
        case other =>
          Left(io.circe.DecodingFailure(s"Unknown update type: $other", cursor.history))
      }
    }
  }
}

class DataApplicationL1Service[F[_]: Async] extends BaseDataApplicationL1Service[F] {
  import DataApplicationL1Service._

  private val dsl = new Http4sDsl[F] {}
  import dsl._

  override def validateUpdate(update: Signed[DataUpdate]): F[Either[DataApplicationValidationError, Unit]] = {
    // Basic signature validation happens at framework level
    // Additional validation can be added here
    Async[F].pure(Right(()))
  }

  override def validateData(data: DataUpdate): F[Either[DataApplicationValidationError, Unit]] = {
    // Note: State-dependent validation happens in combine()
    // Here we only validate the data structure itself
    data match {
      case PolicyVersionUpdate(policyVersion) =>
        // Basic structure validation
        if (policyVersion.policy_id.isEmpty || policyVersion.version.isEmpty) {
          Async[F].pure(Left(DataApplicationValidationError.InvalidData("policy_id and version are required")))
        } else if (policyVersion.content_hash.length != 64) {
          Async[F].pure(Left(DataApplicationValidationError.InvalidData("content_hash must be 64 characters (SHA-256)")))
        } else {
          Async[F].pure(Right(()))
        }

      case ConsentEventUpdate(consentEvent) =>
        // Basic structure validation
        if (consentEvent.subject_id.length != 64) {
          Async[F].pure(Left(DataApplicationValidationError.InvalidData("subject_id must be 64 characters (hashed)")))
        } else {
          Async[F].pure(Right(()))
        }
    }
  }

  override def combine(
      currentState: CalculatedState,
      updates: List[Signed[DataUpdate]]
  ): F[CalculatedState] = {
    val newState = updates.foldLeft(currentState) { (state, signedUpdate) =>
      signedUpdate.value match {
        case PolicyVersionUpdate(policyVersion) =>
          // Validate with current state
          PolicyVersionValidator.validate(policyVersion, state) match {
            case Right(_) =>
              // Use CalculatedState's addPolicyVersion method for automatic index updates
              val updated = state.addPolicyVersion(policyVersion)
              println(s"[PolicyVersion] Added: ${policyVersion.policy_id}:${policyVersion.version}")
              updated
            case Left(error) =>
              // Log validation error but don't fail the snapshot
              println(s"[PolicyVersion] Validation failed: $error")
              state
          }

        case ConsentEventUpdate(consentEvent) =>
          // Validate against current state (checks if PolicyVersion exists)
          ConsentEventValidator.validate(consentEvent, state) match {
            case Right(_) =>
              // Use CalculatedState's addConsentEvent method for automatic index updates
              val updated = state.addConsentEvent(consentEvent)
              println(s"[ConsentEvent] Added: ${consentEvent.subject_id} -> ${consentEvent.policy_ref.policy_id}")
              updated
            case Left(error) =>
              // Log validation error but don't fail the snapshot
              println(s"[ConsentEvent] Validation failed: $error")
              state
          }
      }
    }

    Async[F].pure(newState)
  }

  override def serializeState(state: CalculatedState): F[Array[Byte]] = {
    val json = state.asJson.noSpaces
    Async[F].pure(json.getBytes("UTF-8"))
  }

  override def deserializeState(bytes: Array[Byte]): F[Either[Throwable, CalculatedState]] = {
    val json = new String(bytes, "UTF-8")
    val result = decode[CalculatedState](json).map { state =>
      // Rebuild indices after deserialization to ensure consistency
      CalculatedState.rebuildIndices(state)
    }
    Async[F].pure(result)
  }

  override def serializeUpdate(update: DataUpdate): F[Array[Byte]] = {
    val json = update.asJson.noSpaces
    Async[F].pure(json.getBytes("UTF-8"))
  }

  override def deserializeUpdate(bytes: Array[Byte]): F[Either[Throwable, DataUpdate]] = {
    val json = new String(bytes, "UTF-8")
    Async[F].pure(decode[DataUpdate](json))
  }

  override def serializeBlock(block: Signed[DataUpdate]): F[Array[Byte]] = {
    val json = block.asJson.noSpaces
    Async[F].pure(json.getBytes("UTF-8"))
  }

  override def deserializeBlock(bytes: Array[Byte]): F[Either[Throwable, Signed[DataUpdate]]] = {
    val json = new String(bytes, "UTF-8")
    Async[F].pure(decode[Signed[DataUpdate]](json))
  }

  // Entity encoders/decoders for HTTP
  implicit val dataUpdateEntityEncoder: EntityEncoder[F, DataUpdate] =
    jsonEncoderOf[F, DataUpdate]
  implicit val dataUpdateEntityDecoder: EntityDecoder[F, DataUpdate] =
    jsonOf[F, DataUpdate]
  implicit val calculatedStateEntityEncoder: EntityEncoder[F, CalculatedState] =
    jsonEncoderOf[F, CalculatedState]
  implicit val calculatedStateEntityDecoder: EntityDecoder[F, CalculatedState] =
    jsonOf[F, CalculatedState]

  override def dataEncoder: EntityEncoder[F, DataUpdate] = dataUpdateEntityEncoder
  override def dataDecoder: EntityDecoder[F, DataUpdate] = dataUpdateEntityDecoder
  override def calculatedStateEncoder: EntityEncoder[F, CalculatedState] = calculatedStateEntityEncoder
  override def calculatedStateDecoder: EntityDecoder[F, CalculatedState] = calculatedStateEntityDecoder

  // Custom HTTP routes for Data L1
  override def routes: HttpRoutes[F] = HttpRoutes.of[F] {
    // Info endpoint
    case GET -> Root / "data-application" / "info" =>
      Ok(Map(
        "name" -> "sushiii-metagraph",
        "version" -> "0.1.0",
        "description" -> "Policy-Aware Consent Ledger",
        "endpoints" -> List(
          "/data-application/info",
          "/data-application/policy (POST)",
          "/data-application/consent (POST)",
          "/data-application/policies (GET)",
          "/data-application/consents/:subjectId (GET)"
        )
      ).asJson)

    // Submit policy version
    case req @ POST -> Root / "data-application" / "policy" =>
      for {
        policyVersion <- req.as[PolicyVersion]
        update = PolicyVersionUpdate(policyVersion)
        validationResult <- validateData(update)
        response <- validationResult match {
          case Right(_) =>
            // Log submission
            _ = println(s"[Data L1] Policy submitted: ${policyVersion.policy_id}:${policyVersion.version}")
            Accepted(Map(
              "status" -> "accepted",
              "policy_id" -> policyVersion.policy_id,
              "version" -> policyVersion.version,
              "message" -> "Policy will be included in next block"
            ).asJson)
          case Left(error) =>
            println(s"[Data L1] Policy validation failed: $error")
            BadRequest(Map(
              "error" -> error.toString
            ).asJson)
        }
      } yield response

    // Submit consent event
    case req @ POST -> Root / "data-application" / "consent" =>
      for {
        consentEvent <- req.as[ConsentEvent]
        update = ConsentEventUpdate(consentEvent)
        validationResult <- validateData(update)
        response <- validationResult match {
          case Right(_) =>
            println(s"[Data L1] Consent submitted: ${consentEvent.subject_id}")
            Accepted(Map(
              "status" -> "accepted",
              "subject_id" -> consentEvent.subject_id,
              "message" -> "Consent will be included in next block"
            ).asJson)
          case Left(error) =>
            println(s"[Data L1] Consent validation failed: $error")
            BadRequest(Map(
              "error" -> error.toString
            ).asJson)
        }
      } yield response
  }

  // Note: State query endpoints are handled by L0, not L1
  // L1 is for data submission only
  // Use GET ${l0Url}/snapshots/latest to query current state
}
