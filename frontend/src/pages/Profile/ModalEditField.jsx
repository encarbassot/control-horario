import { useEffect, useState } from "react";
import { TextModal } from "../../elio-react-components/components/Modals/TextModal/TextModal";
import { InputText } from "../../elio-react-components/components/inputs/InputText/InputText";
import { callApi } from "../../api/api";
import { URL_USERS_UPDATE } from "../../api/urls";
import { useElioAuth } from "../../contexts/ElioAuthContext";
import { api } from "../../api/ApiAdapter";
import { getErrMsgFromResp } from "../../utils/error";
import InputPhone from "../../elio-react-components/components/inputs/InputPhone/InputPhone";
import { getPhoneArrayFromString, validatePhoneInput } from "../../elio-react-components/utils/useForm/phone";
import { useTranslation } from 'react-i18next';
import log from "../../utils/log";



export default function ModalEditField({setIsOpen, field, initialValue, title, onSuccess}){
  const { user, updateUser } = useElioAuth()
  const id = user?.id
  const jwt = api.getAccessToken()
  const { t } = useTranslation()

  const formatedInitialValue = field==="phone" ? (initialValue ? getPhoneArrayFromString(initialValue) : ["","",""]) : initialValue

  const [isLoading, setIsLoading] = useState(false)
  const [value, setValue] = useState(formatedInitialValue)
  const [err, setErr] = useState("")
  const [err2,setErr2] = useState("")

  useEffect(()=>{
    setErr("")
    log(value)
  },[value])

  async function handleSubmit(){
    const updateObj = {id}
    if(field==="phone"){
      const {isValid,err,err2,formattedValue} = validatePhoneInput(value)
      if(!isValid){
        setErr(err)
        setErr2(err2)
        return
      }
      updateObj["phone"] = formattedValue
    }else{
      updateObj[field] = value
    }
    log("updateObj",updateObj)
    setIsLoading(true)
    const resp = await callApi(URL_USERS_UPDATE, updateObj, jwt)
    if(resp.success){
      if(onSuccess){
        onSuccess(resp.data)
      }
      updateUser(resp.data)
      setIsOpen(false)
    }else{
      const errStr = getErrMsgFromResp(resp)
      log("ERROR",errStr.text)
      setErr(errStr.text)
    }
    setIsLoading(false)
  }



  return (<>
    <TextModal 
      setIsOpen={setIsOpen} 
      title={title}

      aceptar={handleSubmit}
      aceptarLoading={isLoading}

      cancelar={() => setIsOpen(false)}
    >
      <div className="ModalEditField">
      {
        field === "phone" ?
          <InputPhone
          title={t('common.change_field', {field: title.toLowerCase()})}
          value={value}
          onChange={(e) => setValue(e)}
          autoFocus
          onEnter={handleSubmit}
          error={err}
          error2 = {err2}
          />
          :
          <InputText
          title={t('common.change_field', {field: title.toLowerCase()})}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          onEnter={handleSubmit}
          error={err}
          />
        }
      </div>
      
    </TextModal>
  </>)
}