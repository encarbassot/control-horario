import { useState } from "react";
import { callApi } from "../../api/api";
import { TextModal } from "../../elio-react-components/components/Modals/TextModal/TextModal";
import { URL_DELETE_ACCOUNT, URL_DELETE_ACCOUNT_confirm } from "../../api/urls";
import { useElioAuth } from "../../contexts/ElioAuthContext";
import { api } from "../../api/ApiAdapter";
import { InputText } from "../../elio-react-components/components/inputs/InputText/InputText";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/navigationConfig";
import useApiError from "../../elio-react-components/utils/useApiError";
import { useCountdownTimer } from "../../utils/useCountdownTimer";






export default function ModalDeleteAccount({setIsOpen}){

  const { logout } = useElioAuth()
  const jwt = api.getAccessToken()
  const navigate = useNavigate()

  const [secondStep,setSecondStep] = useState(false)
  const [isLoading,setIsLoading] = useState(false)
  const [code,setCode] = useState("")
  const [err,setErr] = useState("")

  const { formatted } = useCountdownTimer(secondStep ? secondStep.timeout * 60 * 1000 : 0);
  

  const {errModal,errFields,validateResponse,errCode, clearErrors} = useApiError()

  async function handleSubmit(){
    if(secondStep){
      setIsLoading(true)
      const resp = await callApi(URL_DELETE_ACCOUNT_confirm,{code},jwt)
      setIsLoading(false)
      logout()
      navigate(ROUTES.LOGIN)
    }else{

      setIsLoading(true)
      const resp = await callApi(URL_DELETE_ACCOUNT,{},jwt)
      setIsLoading(false)

      validateResponse(resp)
      if(resp.success){
        setSecondStep(resp.data)
      }

    }
  }

  


  if(err){
    return <TextModal 
    title="Error"
    aceptar={()=>setErr("")}
   >
     {err}
   </TextModal>
  }
  return(<>

    {errModal}
    <TextModal
      title="Eliminar cuenta"
      aceptar={handleSubmit}
      cancelar={()=>setIsOpen(false)}
      setIsOpen={setIsOpen}
      aceptarRed
      aceptarLoading={isLoading}
    >
      {
        secondStep ?
        <>
          <p>Se ha enviado un correo electrónico a tu dirección <b>{secondStep.email}</b> , con una validez de {formatted} minutos.</p>
          <p>Introduce el codigo para confirmar la acción</p>
          <InputText 
            title="Código"
            placeholder="ABC123"
            value={code}
            onChange={e=>setCode(e.target.value)}
            autoFocus
          />
        </>
        :
        <p>¿Estás seguro de que quieres eliminar tu cuenta?</p>
      }
    </TextModal>
  </>)
}