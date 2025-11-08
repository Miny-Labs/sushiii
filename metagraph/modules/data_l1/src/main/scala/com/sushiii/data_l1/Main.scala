package com.sushiii.data_l1

import cats.effect.{IO, Resource}
import com.sushiii.shared_data.CalculatedState
import org.tessellation.currency.dataApplication.BaseDataApplicationL1Service
import org.tessellation.currency.l1.CurrencyL1App

object Main extends CurrencyL1App[IO, CalculatedState] {

  override def dataApplication: Option[Resource[IO, BaseDataApplicationL1Service[IO]]] =
    Some(DataApplicationL1Service.make[IO])

  override def genesis: CalculatedState = CalculatedState.empty
}
