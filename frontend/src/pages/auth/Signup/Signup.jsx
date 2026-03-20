import { callApi } from "../../../api/api"
import { InputText } from "../../../elio-react-components/components/inputs/InputText/InputText"
import { useForm } from "../../../elio-react-components/utils/useForm/useForm"
// import { URL_SIGNUP } from "../../api/urls"
import "./Signup.css"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getUserPlaceholder } from "../../../utils/utils"
import { InputPassword } from "../../../elio-react-components/components/inputs/InputPassword/InputPassword"
import { URL_GET_LOCATIONS, URL_SIGNUP } from "../../../api/urls"
import { TextModal } from "../../../elio-react-components/components/Modals/TextModal/TextModal"
import log from "../../../utils/log"
import { ROUTES } from "../../../routes/navigationConfig"
import InputPhone from "../../../elio-react-components/components/inputs/InputPhone/InputPhone"
import { validatePhoneInput } from "../../../elio-react-components/utils/useForm/phone"
import { toTitleCase } from "../../../elio-react-components/utils/utils"
import { useCountdownTimer } from "../../../utils/useCountdownTimer"
import { useMinimumLoading } from "../../../utils/useMinimumLoading"
import { InputSelect } from "../../../elio-react-components/components/inputs/InputSelect/InputSelect"
import { useTranslation } from 'react-i18next'

const userPlaceholder = getUserPlaceholder()

export default function Signup(){

  const navigate = useNavigate();

  const containerRef = useRef(null)

  const location = useLocation()
  const emailFromLocation = location.state?.email


  const { isLoading, setIsLoading } = useMinimumLoading(500);
  const { t } = useTranslation()
  const [success,setSuccess] = useState(null)

  const [errCodePhone,setErrCodePhone] = useState("")



  const { formatted } = useCountdownTimer(success ? success.timeout * 60 * 1000 : 0);


  const refEmail = useRef()
  const refPhone = useRef()
  const refPassword = useRef()
  const refPassword2 = useRef()

  const [
    [
      [inpName,setInpName,errName,setErrName],
      [inpEmail,setInpEmail,errEmail,setErrEmail],
      [inpPhone,setInpPhone,errPhone,setErrPhone],
      [inpPassword,setInpPassword,errPassword,setErrPassword],
      [inpPassword2,setInpPassword2,errPassword2,setErrPassword2],
    ],
    {getFormValues,resetFormValues,formIsEdited,validateForEmptyFields,validateFoValidFields}
  ] = useForm([
    {fieldName:"name"},
    {fieldName:"email", value:emailFromLocation||""},
    {fieldName:"phone",},
    {fieldName:"password",validator:"password"},
    {fieldName:"password2",validator:"password2"},
  ])




  useEffect(()=>{
    if(containerRef.current){
      try{ containerRef.current.scrollTo({top:0, left:0, behavior:'auto'}) }catch(e){ containerRef.current.scrollTop = 0 }
    }
  },[])










  async function handleSubmit(e){
    
    if(isLoading) return
    if(!validateForEmptyFields())return
    if(!validateFoValidFields())return
    
    
    const {phone,location,...payload} = getFormValues()
    log(payload,phone,location)

    //PHONE VALIDATION
    let phoneValue = undefined
    if(inpPhone[1]){
      const {isValid,err,err2,formattedValue} = validatePhoneInput(inpPhone)
      if(!isValid){
        setErrCodePhone(err2)
        setErrPhone(err)
        return
      }
      phoneValue = formattedValue      
    }

    setIsLoading(true)
    const response = await callApi(URL_SIGNUP,{
      phone:phoneValue,
      location_id:location?.id,
      ...payload
    })
    setIsLoading(false)
    log(response)

    if(!response.success){
      const errMsg = response.error?.general?.[0] ?? response.err?.msg ?? ''
      if(response.error?.code === 'CONFLICT' || errMsg.toLowerCase().includes('duplicate') || errMsg.toLowerCase().includes('already') || response.err?.msg === "Duplicate data" || response.err?.ERROR === "DUPLICATE_EMAIL"){
        setErrEmail(t('signup.error_duplicate'))
      }else if(response.err?.error === "UNAUTHORIZED"){
        setErrEmail(t('signup.error_unauthorized'))
      }
    }else{
      setSuccess(response)
    }



  }





  return(
    <>

    {
      success && <TextModal title={t('signup.success_title')} aceptar={()=>      navigate(ROUTES.ACTIVATE,{state:{email:inpEmail}})    }>
        <p>{t('signup.success_email_sent', {email: success.email})}</p>
        <p>{t('common.expires_in', {time: formatted})}</p>
      </TextModal>
    }
    <div className="Signup" ref={containerRef}>
    
    <div className="form">
      <h1>{t('signup.title')}</h1>

      <InputText
        title={t('signup.name_label')}
        value={inpName}
        onChange={e=>setInpName(toTitleCase(e.target.value))}
        error={errName}
        placeholder={userPlaceholder.name}
        onEnter={()=>refEmail?.current?.focus()}
        autoFocus
      />

      <InputText
        title="Email"
        value={inpEmail}
        onChange={e=>setInpEmail(e.target.value.toLowerCase())}
        error={errEmail}
        placeholder={userPlaceholder.email}
        ref={refEmail}
        onEnter={()=>refPhone?.current?.focus()}
      />

      <InputPhone
        title={t('common.phone')}
        value={inpPhone}
        onChange={phone=>setInpPhone(phone)}
        error={errPhone}
        ref={refPhone}
        onEnter={()=>refPassword?.current?.focus()}
        hint={t('signup.phone_hint')}
      />


      <InputPassword
        title={t('common.password')}
        value={inpPassword}
        onChange={e=>setInpPassword(e.target.value)}
        error={errPassword}
        ref={refPassword}
        onEnter={()=>refPassword2?.current?.focus()}
      />

      <InputPassword
        title={t('common.repeat_password')}
        value={inpPassword2}
        onChange={e=>setInpPassword2(e.target.value)}
        error={errPassword2}
        ref={refPassword2}
        onEnter={handleSubmit}
      />

      <button className="button" onClick={handleSubmit}>
        {
          isLoading ? <span className="spinner small"></span>:
          t('signup.submit')
        }
      </button>

      <p className="link">{t('signup.already_account')} <Link to={ROUTES.LOGIN} state={{email:inpEmail}}>{t('signup.login_link')}</Link></p>
    </div>
    
  </div>
  </>)
}