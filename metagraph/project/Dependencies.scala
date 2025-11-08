import sbt._

object Dependencies {

  object V {
    val tessellation = "3.5.6"
    val catsCore = "2.10.0"
    val catsEffect = "3.5.2"
    val circe = "0.14.6"
    val http4s = "0.23.18"
    val scalaTest = "3.2.17"
    val betterMonadicFor = "0.3.1"
    val kindProjector = "0.13.2"
    val semanticDb = "4.7.1"
  }

  object Libraries {
    val tessellationSDK = "io.constellationnetwork" %% "tessellation-sdk" % V.tessellation
    val tessellationCurrencyL0 = "io.constellationnetwork" %% "tessellation-currency-l0" % V.tessellation
    val tessellationCurrencyL1 = "io.constellationnetwork" %% "tessellation-currency-l1" % V.tessellation

    val catsCore = "org.typelevel" %% "cats-core" % V.catsCore
    val catsEffect = "org.typelevel" %% "cats-effect" % V.catsEffect

    val circeCore = "io.circe" %% "circe-core" % V.circe
    val circeGeneric = "io.circe" %% "circe-generic" % V.circe
    val circeParser = "io.circe" %% "circe-parser" % V.circe

    val http4sDsl = "org.http4s" %% "http4s-dsl" % V.http4s
    val http4sCirce = "org.http4s" %% "http4s-circe" % V.http4s

    val scalaTest = "org.scalatest" %% "scalatest" % V.scalaTest % Test
  }

  object CompilerPlugins {
    val betterMonadicFor = compilerPlugin("com.olegpy" %% "better-monadic-for" % V.betterMonadicFor)
    val kindProjector = compilerPlugin(("org.typelevel" % "kind-projector" % V.kindProjector).cross(CrossVersion.full))
    val semanticDb = compilerPlugin(("org.scalameta" % "semanticdb-scalac" % V.semanticDb).cross(CrossVersion.full))

    val all = Seq(betterMonadicFor, kindProjector, semanticDb)
  }
}
