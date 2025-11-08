name := "sushiii-metagraph"

ThisBuild / version := "0.1.0"
ThisBuild / scalaVersion := "2.13.12"
ThisBuild / organization := "com.sushiii"
ThisBuild / evictionErrorLevel := Level.Warn

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
    "-Xlint",
    "-Ymacro-annotations"
  ),
  resolvers ++= Seq(
    Resolver.mavenLocal,
    "Constellation Public" at "https://maven.pkg.github.com/Constellation-Labs/constellation",
    Resolver.sonatypeRepo("releases"),
    Resolver.sonatypeRepo("snapshots")
  ),
  libraryDependencies ++= Seq(
    compilerPlugin("com.olegpy" %% "better-monadic-for" % "0.3.1"),
    compilerPlugin(("org.typelevel" % "kind-projector" % "0.13.2").cross(CrossVersion.full))
  )
)

lazy val constellationVersion = "3.5.6"

lazy val shared = (project in file("modules/shared"))
  .enablePlugins(AshScriptPlugin, BuildInfoPlugin, JavaAppPackaging)
  .settings(commonSettings)
  .settings(
    name := "sushiii-shared",
    libraryDependencies ++= Seq(
      "io.constellationnetwork" %% "tessellation-sdk" % constellationVersion,
      "org.typelevel" %% "cats-core" % "2.10.0",
      "org.typelevel" %% "cats-effect" % "3.5.2",
      "io.circe" %% "circe-core" % "0.14.3",
      "io.circe" %% "circe-generic" % "0.14.3",
      "io.circe" %% "circe-parser" % "0.14.3",
      "org.scalatest" %% "scalatest" % "3.2.17" % Test
    )
  )

lazy val data_l1 = (project in file("modules/data_l1"))
  .enablePlugins(AshScriptPlugin, BuildInfoPlugin, JavaAppPackaging)
  .dependsOn(shared)
  .settings(commonSettings)
  .settings(
    name := "sushiii-data-l1",
    libraryDependencies ++= Seq(
      "io.constellationnetwork" %% "tessellation-currency-l1" % constellationVersion,
      "org.http4s" %% "http4s-dsl" % "0.23.18",
      "org.http4s" %% "http4s-circe" % "0.23.18"
    ),
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", _*) => MergeStrategy.discard
      case "reference.conf" => MergeStrategy.concat
      case "application.conf" => MergeStrategy.concat
      case PathList("deriving.conf") => MergeStrategy.concat
      case x if x.endsWith("module-info.class") => MergeStrategy.discard
      case x if x.contains("io.netty.versions") => MergeStrategy.first
      case x if x.contains("logback.xml") => MergeStrategy.first
      case _ => MergeStrategy.first
    },
    assembly / assemblyJarName := "sushiii-metagraph-l1-assembly-0.1.0.jar"
  )

lazy val l0 = (project in file("modules/l0"))
  .enablePlugins(AshScriptPlugin, BuildInfoPlugin, JavaAppPackaging)
  .dependsOn(shared)
  .settings(commonSettings)
  .settings(
    name := "sushiii-l0",
    libraryDependencies ++= Seq(
      "io.constellationnetwork" %% "tessellation-currency-l0" % constellationVersion
    ),
    assembly / assemblyMergeStrategy := {
      case PathList("META-INF", _*) => MergeStrategy.discard
      case "reference.conf" => MergeStrategy.concat
      case "application.conf" => MergeStrategy.concat
      case PathList("deriving.conf") => MergeStrategy.concat
      case x if x.endsWith("module-info.class") => MergeStrategy.discard
      case x if x.contains("io.netty.versions") => MergeStrategy.first
      case x if x.contains("logback.xml") => MergeStrategy.first
      case _ => MergeStrategy.first
    },
    assembly / assemblyJarName := "sushiii-metagraph-l0-assembly-0.1.0.jar"
  )

lazy val root = (project in file("."))
  .aggregate(shared, data_l1, l0)
  .settings(
    name := "sushiii-metagraph-root",
    publish / skip := true
  )
