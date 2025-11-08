package com.sushiii.l0

import cats.effect.IO
import com.sushiii.shared_data.CalculatedState
import org.tessellation.currency.l0.CurrencyL0App

object Main extends CurrencyL0App[IO, CalculatedState] {

  override def genesis: CalculatedState = CalculatedState.empty
}
