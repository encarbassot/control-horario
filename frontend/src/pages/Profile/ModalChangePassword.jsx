import { useState } from "react";
import { TextModal } from "../../elio-react-components/components/Modals/TextModal/TextModal";
import { useForm } from "../../elio-react-components/utils/useForm/useForm";
import { InputPassword } from "../../elio-react-components/components/inputs/InputPassword/InputPassword";
import { useElioAuth } from "../../contexts/ElioAuthContext";
import { api } from "../../api/ApiAdapter";
import { callApi } from "../../api/api";
import { URL_CHANGE_PASSWORD } from "../../api/urls";



export default function ModalChangePassword({setIsOpen}){

  const { logout } = useElioAuth()
  const jwt = api.getAccessToken()

  const [err,setErr] = useState("")
  const [isLoading,setIsLoading] = useState(false)
  const [success,setSuccess] = useState(false)

  const [
    [
      [inpOldPassword,setInpOldPassword,errOldPassword,setErrOldPassword],
      [inpPassword,setInpPassword,errPassword,setErrPassword],
      [inpPassword2,setInpPassword2,errPassword2,setErrPassword2],
    ],
    {getFormValues,resetFormValues,formIsEdited,validateForEmptyFields,validateFoValidFields}
  ] = useForm([
    {fieldName:"oldPassword"},
    {fieldName:"password", validator:"password"},
    {fieldName:"password2", validator:"password2"},
  ])



  async function handleChangePassword(){

    if(success){
      setIsOpen(false)
      logout()
      return
    }

    if(!validateForEmptyFields())return
    if(!validateFoValidFields())return

    const payload = getFormValues()
    
    setIsLoading(true)
    const response = await callApi(URL_CHANGE_PASSWORD,payload,jwt)
    setIsLoading(false)

    if(response.success){
      setSuccess(true)
    }else{
      setErrOldPassword("Contraseña incorrecta")
    }
  }

  function handleExitPassword(){
    setIsOpen(false)
  }



  return(
    <TextModal
      title = "Cambiar contraseña"
      aceptar={handleChangePassword}
      cancelar={success ? undefined : handleExitPassword}
      setIsOpen={setIsOpen}
      aceptarLoading={isLoading}
    >
      {
        success 
        ?
        <p>Contraseña cambiada correctamente</p>
        :
        <>
          <InputPassword
            title="Contraseña actual"
            value={inpOldPassword}
            onChange={e=>setInpOldPassword(e.target.value)}
            error={errOldPassword}
            autoFocus
          />

          <InputPassword
            title="Nueva contraseña"
            value={inpPassword}
            onChange={e=>setInpPassword(e.target.value)}
            error={errPassword}
          />

          <InputPassword
            title="Repetir nueva contraseña"
            value={inpPassword2}
            onChange={e=>setInpPassword2(e.target.value)}
            error={errPassword2}
          />
      </>
    }

    </TextModal>
  )
}