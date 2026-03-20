import { useEffect, useState } from "react"
import { callApi } from "../../../api/api"
import { URL_ACTIVATE, URL_VALIDATE } from "../../../api/urls"
import { InputPassword } from "../../../elio-react-components/components/inputs/InputPassword/InputPassword"
import { InputText } from "../../../elio-react-components/components/inputs/InputText/InputText"
import { useForm } from "../../../elio-react-components/utils/useForm/useForm"
import "./Validate.css"
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { TextModal } from "../../../elio-react-components/components/Modals/TextModal/TextModal"
import log from "../../../utils/log"
import { ROUTES } from "../../../routes/navigationConfig"
import { useCountdownTimer } from "../../../utils/useCountdownTimer"
import { useMinimumLoading } from "../../../utils/useMinimumLoading"
import { useTranslation } from 'react-i18next'

export default function Validate({activate = false}){
  const navigate = useNavigate();


  const { token,email:emailParam } = useParams();

  const location = useLocation()
  const emailFromLocation = location.state?.email
  const timeoutFromLocation = location.state?.timeout
  const {formatted} = timeoutFromLocation ? useCountdownTimer(Number(timeoutFromLocation) * 60 * 1000) : {formatted:null}

  const email = emailFromLocation || emailParam 

  const [err,setErr] = useState("")
  const [success,setSuccess] = useState(false)
  const { isLoading, setIsLoading } = useMinimumLoading(800);
  const { t } = useTranslation()


  const [
    [
      [inpToken,setInpToken,errToken,setErrToken],
      [inpEmail,setInpEmail,errEmail,setErrEmail],
      [inpPassword,setInpPassword,errPassword,setErrPassword],
      [inpPassword2,setInpPassword2,errPassword2,setErrPassword2],
    ],
    {getFormValues,resetFormValues,formIsEdited,validateForEmptyFields,validateFoValidFields}
  ] = useForm([
    {fieldName:"token",noMandatory:!!token},
    {fieldName:"email", noMandatory:!!email, value:email},
    {fieldName:"password", validator:"password"  , noMandatory:activate},
    {fieldName:"password2", validator:"password2", noMandatory:activate},
  ])


  useEffect(()=>{
    if(activate && token && email){
      log("ACTIVATE AUTO",token,email)
    }
  },[])




  async function handleSubmit(e){
    e.preventDefault()

    
    
    if(!validateForEmptyFields()){
      log(errToken,errEmail)
      return
    }
    if(!validateFoValidFields()){
      log(errToken,errEmail)
      return
    }
    // if(!formIsEdited()) return


    const payload = getFormValues()
    log(payload,token, email)
    payload.token = token || payload.token
    payload.email = email || payload.email

    log("PAYLOAD",payload)


    let response

    setIsLoading(true)
    if(activate){
      response = await callApi(URL_ACTIVATE,payload)
    }else{
      response = await callApi(URL_VALIDATE,payload)
    }
    setIsLoading(false)

    if(response.success){
      setSuccess(true)
    }else{
      setErr(t('validate.wrong_code'))
    }



  }
  


  return <div className="Validate">


    {err && 
      <TextModal title={"Error"} aceptar={()=>setErr("")}>
        {err}
      </TextModal>
    }

    {(success && !isLoading) &&
      <TextModal title={t('validate.success_title')} aceptar={()=>      navigate(ROUTES.LOGIN,{state:{email}})    }>
        {t('validate.success_message')}
        <br/>
        {t('validate.success_subtitle')}
      </TextModal>
    }

    <div className="info">
      <h1>{activate ? t('validate.activate_title') : t('validate.validate_title')}</h1>
      {
        activate ?
        <div className="center">
          <p>{t('validate.activate_subtitle')}</p>
          {(timeoutFromLocation) &&<>
            <p>{t('validate.email_sent')}{email && <> {t('validate.email_sent_to')} <b>{email}</b></>}</p>
            <p>{t('common.expires_in', {time: formatted})}</p>
          </>
          }
        </div>
        :<p>{t('validate.validate_subtitle')}</p>
      }
    </div>


    <div className="form">

      { (!(email && token)) &&

      <>
        <InputText
          title={t('common.code')}
          placeholder ="A1B2C3"
          value = {inpToken}
          onChange = {e => setInpToken (e.target.value.toUpperCase())}
          error={errToken}
          autoFocus 
        />

        <InputText
          title = "Email"
          placeholder ="juantorres@gmail.com"
          value = {inpEmail}
          onChange = {e => setInpEmail (e.target.value)}
          error={errEmail}
        />
      </>
      }

      {!activate &&
        <>
          <InputPassword
            title={t('common.password')}
            value={inpPassword}
            onChange={e=>setInpPassword(e.target.value)}
            error={errPassword}
            autoFocus = {token && email}
          />

          <InputPassword
            title={t('common.repeat_password')}
            value={inpPassword2}
            onChange={e=>setInpPassword2(e.target.value)}
            error={errPassword2}
            onEnter={handleSubmit}
          />
        </>
      }


      <button className="button" onClick={e=>handleSubmit(e)}>
        {
          isLoading ? <span className="spinner small"></span>:
          activate ? t('validate.activate_btn') : t('validate.validate_btn')
        }  
      </button>

      <p className="link">{t('validate.already_account')} <Link to={ROUTES.LOGIN} state={{email:inpEmail}}>{t('validate.login_link')}</Link></p>

      
    </div>
  </div>
}