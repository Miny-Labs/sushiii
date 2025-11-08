name := "sushiii-metagraph"

ThisBuild / version := "0.1.0"
ThisBuild / scalaVersion := "2.13.12"
ThisBuild / organization := "com.sushiii"

lazy val commonSettings = Seq(
  scalacOptions ++= Seq(
    "-deprecation",
    "-encoding",
    "UTF-8",
    "-feature",
    "-language:existentials",
    "-language:higherKinds",
    "-language:implicitConversions",
    "-unchecked",
    "-Xlint"
  ),
  resolvers ++= Seq(
    "Constellation Public" at "https://maven.pkg.github.com/Constellation-Labs/constellation",
    Resolver.sonatypeRepo("releases"),
    Resolver.sonatypeRepo("snapshots")
  )
)

lazy val constellationVersion = "2.9.0"

lazy val shared = (project in file("shared"))
  .settings(commonSettings)
  .settings(
    name := "sushiii-shared",
    libraryDependencies ++= Seq(
      "org.constellation" %% "tessellation-shared" % constellationVersion,
      "org.constellation" %% "tessellation-currency-l0" % constellationVersion,
      "org.typelevel" %% "cats-core" % "2.10.0",
      "org.typelevel" %% "cats-effect" % "3.5.2",
      "io.circe" %% "circe-core" % "0.14.6",
      "io.circe" %% "circe-generic" % "0.14.6",
      "io.circe" %% "circe-parser" % "0.14.6",
      "org.scalatest" %% "scalatest" % "3.2.17" % Test
    )
  )

lazy val data_l1 = (project in file("data_l1"))
  .dependsOn(shared)
  .settings(commonSettings)
  .settings(
    name := "sushiii-data-l1",
    libraryDependencies ++= Seq(
      "org.constellation" %% "tessellation-currency-l1" % constellationVersion,
      "org.http4s" %% "http4s-dsl" % "0.23.18",
      "org.http4s" %% "http4s-circe" % "0.23.18"
    ),
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", _*) => MergeStrategy.discard
      case "reference.conf" => MergeStrategy.concat
      case _ => MergeStrategy.first
    },
    assembly / assemblyJarName := "sushiii-data-l1.jar"
  )

lazy val l0 = (project in file("l0"))
  .dependsOn(shared)
  .settings(commonSettings)
  .settings(
    name := "sushiii-l0",
    libraryDependencies ++= Seq(
      "org.constellation" %% "tessellation-currency-l0" % constellationVersion
    ),
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", _*) => MergeStrategy.discard
      case "reference.conf" => MergeStrategy.concat
      case _ => MergeStrategy.first
    },
    assembly / assemblyJarName := "sushiii-l0.jar"
  )

lazy val root = (project in file("."))
  .aggregate(shared, data_l1, l0)
  .settings(
    name := "sushiii-metagraph-root",
    publish / skip := true
  )
