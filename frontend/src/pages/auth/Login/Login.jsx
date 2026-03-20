import version from "../../../../scripts/version"
import { callApi } from "../../../api/api"
import { URL_REQUEST_VALIDATION } from "../../../api/urls"
import { api } from "../../../api/ApiAdapter"
import { useElioAuth } from "../../../contexts/ElioAuthContext.jsx"
import { InputPassword } from "../../../elio-react-components/components/inputs/InputPassword/InputPassword"
import { InputText } from "../../../elio-react-components/components/inputs/InputText/InputText"
import { useForm } from "../../../elio-react-components/utils/useForm/useForm"
import "./Login.css"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { getUserPlaceholder } from "../../../utils/utils"
import log from "../../../utils/log"
import { ROUTES } from "../../../routes/navigationConfig"
import useApiError from "../../../elio-react-components/utils/useApiError"
import { useMinimumLoading } from "../../../utils/useMinimumLoading"
import { useTranslation } from 'react-i18next'


const userPlaceholder = getUserPlaceholder()

export default function Login(){
  const navigate = useNavigate()
  const location = useLocation()
  const emailFromSignup = location.state?.email


  const { isLoading, setIsLoading } = useMinimumLoading(500);

  const {errModal,errFields,validateResponse,errCode, clearErrors} = useApiError()
  const { t } = useTranslation()
  const { login } = useElioAuth()

  const [isLoadingRequestValidation,setIsLoadingRequestValidation] = useState(false)

  const passwordRef = useRef(null)


  const [
    [
      [inpEmail,setInpEmail, errEmail],
      [inpPassword,setInpPassword,errPassword],
    ],
    {getFormValues,resetFormValues,formIsEdited,validateForEmptyFields,validateFoValidFields}
  ] = useForm([
    {fieldName:"email", value:emailFromSignup||""},
    {fieldName:"password"},
  ],{onFieldUpdate:clearErrors})

  async function handleSubmit(e){
    e?.preventDefault()

    if(!validateForEmptyFields())return

    const { email, password } = getFormValues()
    console.log("Login submit", { email, password })

    setIsLoading(true)
    const { success, data, error } = await login({ email, password })
    log({ success, data, error })
    setIsLoading(false)

    if(!success){
      validateResponse({ success, err: error })   // bridge to existing error hook
      if(error?.code === "CONFLICT" || error?.general?.includes?.("CONFLICT")){
        handleRequestValidation()
      }
      return
    }

    // LoginDataContext reacts to the user change pushed by ElioAuthProvider.
    // Just navigate — no manual saveLoginData call needed.
    navigate('/')
  }

  async function handleRequestValidation(){
    setIsLoadingRequestValidation(true)
    const resp = await callApi(URL_REQUEST_VALIDATION,{email:inpEmail})
    setIsLoadingRequestValidation(false)

    validateResponse(resp)
    

    if(resp.success){
      navigate(ROUTES.ACTIVATE,{
        state:{email:inpEmail,timeout:resp?.data?.timeout}
      })
    }

  }

  return (<>

  {errModal}
  <div className="Login">


    <div className="form">
      
      <h1>Login</h1>
      
      <InputText
        title = "Email"
        placeholder ={userPlaceholder.email}
        value = {inpEmail}
        onChange = {e => setInpEmail (e.target.value.toLowerCase())}
        error={errEmail || errFields?.email}
        onEnter={passwordRef.current?.focus}
        autoFocus={!Boolean(emailFromSignup)}
        optional
      />
      <InputPassword
        ref={passwordRef}
        title={t('common.password')}
        value={inpPassword}
        onChange={e=>setInpPassword(e.target.value)}
        error={errPassword || errFields?.password}
        onEnter={handleSubmit}
        autoFocus={Boolean(emailFromSignup)}
        optional
      />


      <button className="button" onClick={handleSubmit} disabled={errCode === "CONFLICT"}>
      {
        (isLoading || isLoadingRequestValidation)?
        <span className="spinner small"/>:
        t('login.submit')
      }
      </button>      

      {
        errFields?.password &&
        <Link 
          to={ ROUTES.RESET_PASSWORD}
          state = {{ email: inpEmail }}
          style={{ textAlign: "center" }}
        >
          {t('login.forgot_password')}
        </Link>
      }


      <p className="link">{t('login.no_account')} <Link to={ROUTES.SIGNUP}>{t('login.register_link')}</Link></p>

        
    </div>

    <footer>
      <p className="version">{version}</p>
    </footer>
  </div>

  </>)
}