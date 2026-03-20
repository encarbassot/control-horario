import "./ExpandingLogo.css"

import logoT from "../../../assets/logo/logo-T.svg"
import logoI from "../../../assets/logo/logo-I.svg"
import logoM from "../../../assets/logo/logo-M.svg"
import logoE from "../../../assets/logo/logo-E.svg"
import clock from "../../../assets/logo/clock.png"




export default function ExpandingLogo({expanded=false}){

  return(
  <div className={"ExpandingLogo" + (expanded?" expanded":"")}>

    <span className="expander"></span>

    <img src={clock} alt="clock" />
    <img src={logoT} alt="T" />
    <img src={logoI} alt="I" />
    <img src={logoM} alt="M" />
    <img src={logoE} alt="E" />


  </div>
  )
}