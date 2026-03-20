


import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import "./Users.css"
import { useElioAuth } from "../../contexts/ElioAuthContext";
import { api } from "../../api/ApiAdapter";
import { useForm } from "../../elio-react-components/utils/useForm/useForm"
import { TextModal } from "../../elio-react-components/components/Modals/TextModal/TextModal"
import { InputText } from "../../elio-react-components/components/inputs/InputText/InputText"
import InputPhone from "../../elio-react-components/components/inputs/InputPhone/InputPhone"
import { getPermisionsEqualLower } from "../../permissions"
import { InputSelect } from "../../elio-react-components/components/inputs/InputSelect/InputSelect"
import { callApi } from "../../api/api"
import { URL_USERS_CREATE } from "../../api/urls"
import { URL_USERS_UPDATE } from "../../api/urls"
import { getUserPlaceholder } from "../../utils/utils"
import log from "../../utils/log"
import { toTitleCase } from "../../elio-react-components/utils/utils"
import { validatePhoneInput, getPhoneArrayFromString } from "../../elio-react-components/utils/useForm/phone"

const userPlaceholder = getUserPlaceholder()

export default function ModalCreateUser({editingElement,onExit,onChange,locations=[]}){
  const { user } = useElioAuth()
  const permissions = user?.permissions ?? 0
  const { t } = useTranslation()
  const availablePermissions = Object.keys(getPermisionsEqualLower(permissions))

  const [isLoading,setIsLoading] = useState(false)
  const [inpPermissions,setInpPermissions] = useState(availablePermissions[0])



  const [
    [
      [inpName,setInpName,errName,setErrName],
      [inpEmail,setInpEmail,errEmail,setErrEmail],
      [inpPhone,setInpPhone,errPhone,setErrPhone],
      [inpLocation,setInpLocation,errLocation,setErrLocation],
    ],
    {getFormValues,resetFormValues,formIsEdited,validateForEmptyFields,validateFoValidFields}
  ] = useForm([
    {fieldName:"name",validator:[{type: "minlength", n: 4},{type:"maxlength",n:50}]},
    {fieldName:"email"},
    {fieldName:"phone", noMandatory:true},
    {fieldName:"location",noMandatory:true}
  ])


  useEffect(()=>{
    if(!editingElement) return
    setInpName(editingElement.name || "")
    setInpEmail(editingElement.email || "")
    setInpPermissions(editingElement.role || availablePermissions[0])
    // phone may be null or a string
    if(editingElement.phone){
      setInpPhone(getPhoneArrayFromString(editingElement.phone))
    }
    if(editingElement.ubication_id && locations && locations.length>0){
      const match = locations.find(l=>l.id === editingElement.ubication_id) || editingElement.location
      if(match) setInpLocation(match)
    } else if(editingElement.location){
      setInpLocation(editingElement.location)
    }
  },[editingElement, locations])



  async function handleCreateUpdate(){
    if(!validateForEmptyFields()) return
    if(!validateFoValidFields()) return
    if(!formIsEdited()) return

    const {location, phone, ...payload} = getFormValues()

    let phoneValue = undefined
    if(phone && phone[1]){
      const {isValid, err, err2, formattedValue} = validatePhoneInput(phone)
      if(!isValid){
        setErrPhone(err || err2)
        return
      }
      phoneValue = formattedValue
    }

    setIsLoading(true)

    if(editingElement){
      const updateObj = {
        id: editingElement.id,
        name: payload.name || undefined,
        phone: phoneValue,
        ubication_id: location?.id || undefined,
      }
      const resp = await callApi(URL_USERS_UPDATE, updateObj, api.getAccessToken())
      if(resp && resp.success){
        if(onChange) onChange(resp.data.user || resp.data)
        handleExitCreateUpdate()
      }else{
        setErrEmail((resp && resp.err && resp.err.msg) || t('users.update_error'))
      }
      log(resp)
    }else{
      const resp = await callApi(URL_USERS_CREATE,{
        ...payload,
        phone: phoneValue,
        location_id: location?.id,
        role:inpPermissions
      },api.getAccessToken())

      if(resp.success){
        const justCreated = resp.data.user
        if(onChange){
          onChange(justCreated,resp.data)
        }

        handleExitCreateUpdate()
      }else{
        if(resp.err.error === "DUPLICATE"){
          setErrEmail(t('users.already_exists'))
        }else if(resp.err?.more?.length > 0){
          if(resp.err?.more[0].context.key === "name"){
            setErrName(resp.err.more[0].message)
          }else if(resp.err.more[0].context.key === "email"){
            setErrEmail(resp.err.more[0].message)
          } 
        }
      }
      log(resp)
    }

    setIsLoading(false)

  }



  function handleExitCreateUpdate(){

    onExit()
  }



  return (
    <TextModal
      title={editingElement ? t('users.edit_title') : t('users.create_title')}
      aceptar={handleCreateUpdate}
      cancelar={handleExitCreateUpdate}
      setIsOpen={handleExitCreateUpdate}
      aceptarLoading={isLoading}
    >

      <InputText 
        onChange={e=>setInpName(toTitleCase(e.target.value))}
        value={inpName}
        placeholder = {userPlaceholder.name}
        error = {errName}
        autoFocus
        title={t('users.field_name')}
      />

      <InputText 
        onChange={e=>setInpEmail(e.target.value.toLowerCase())}
        value={inpEmail}
        placeholder = {userPlaceholder.email}
        error = {errEmail}
        title={t('users.field_email')}
      />

      <InputPhone
        title={t('users.field_phone')}
        value={inpPhone}
        onChange={phone=>setInpPhone(phone)}
        error={errPhone}
        hint={t('users.field_optional')}
      />

      <InputSelect
        title={t('users.field_role')}
        options={availablePermissions}
        onChange={v=>setInpPermissions(v)}
        value={inpPermissions}
      />

      {
        USER_HAS_FIXED_LOCATION &&
        <InputSelect
          optional={false}
          title={t('users.field_location')}
          options={locations}
          formatViewOption={opt=>opt?.name || t('users.field_select_location')}
          onChange={setInpLocation}
          value={inpLocation}
          error={errLocation}
        /> 
      }

      <br /><br /><br />

    </TextModal>
  )
}