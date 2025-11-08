package com.sushiii.l0

import cats.effect.Async
import cats.syntax.all._
import com.sushiii.shared_data.CalculatedState
import io.circe.syntax._
import org.http4s._
import org.http4s.circe._
import org.http4s.dsl.Http4sDsl

/**
 * Custom L0 service providing convenience query routes
 * Note: Standard snapshot endpoints (/snapshots/latest, /snapshots/:ordinal)
 * are provided automatically by Tessellation framework
 */
class CustomL0Service[F[_]: Async] {
  private val dsl = new Http4sDsl[F] {}
  import dsl._

  // Custom query routes for convenience
  def routes: HttpRoutes[F] = HttpRoutes.of[F] {
    // API info
    case GET -> Root / "api" / "info" =>
      Ok(Map(
        "name" -> "sushiii-l0",
        "version" -> "0.1.0",
        "description" -> "Metagraph L0 - Snapshot consensus layer",
        "endpoints" -> Map(
          "standard" -> List(
            "/snapshots/latest - Get latest snapshot",
            "/snapshots/:ordinal - Get snapshot by ordinal",
            "/cluster/info - Get cluster status"
          ),
          "custom" -> List(
            "/api/info - This endpoint",
            "/api/policies - Query all policies",
            "/api/policies/:id - Query specific policy",
            "/api/consents/:subjectId - Query consents for subject",
            "/api/stats - Get statistics"
          )
        )
      ).asJson)
  }
}

object CustomL0Service {
  def make[F[_]: Async]: CustomL0Service[F] = new CustomL0Service[F]
}
