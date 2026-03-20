import { useEffect, useState } from "react"
import { InputSelect } from "../elio-react-components/components/inputs/InputSelect/InputSelect"





export default function InputLocation({
  value,
  locations = [],
  showText = "Seleccionar ubicación",
  onChange = ()=>{},
  allowUnselect = false,
  unselectStr = "Sin ubicación", // Todas las ubicaciones ....
  ...props
}){

  const [inpLocation, setInpLocation] = useState(value)

  const handleOnChange = (opt) => {
    setInpLocation(opt)
    if(onChange){
      onChange(opt)
    }
  }

  useEffect(()=>{
    if(value?.id !== inpLocation?.id){
      setInpLocation(value)
    }
  },[value])

            
  return <InputSelect
    className={"button"}
    inline
    options={locations}
    formatViewOption={opt=>opt?.name || (allowUnselect ? resolvedUnselectStr : resolvedShowText)}
    onChange={handleOnChange}
    value={inpLocation}
    allowUnselect={allowUnselect}
    unselectStr={resolvedUnselectStr}
    {...props}
  />

}