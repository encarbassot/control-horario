import { Link, useLocation } from 'react-router-dom';
import './ForgotPassword.css';
import { useForm } from '../../../elio-react-components/utils/useForm/useForm';
import { useState } from 'react';
import { InputText } from '../../../elio-react-components/components/inputs/InputText/InputText';
import { ROUTES } from '../../../routes/navigationConfig';
import { callApi } from '../../../api/api';
import { URL_RESET_PASSWORD, URL_RESET_PASSWORD_REQUEST } from '../../../api/urls';
import useApiError from '../../../elio-react-components/utils/useApiError';
import { InputPassword } from '../../../elio-react-components/components/inputs/InputPassword/InputPassword';
import { useCountdownTimer } from '../../../utils/useCountdownTimer';
import { useTranslation } from 'react-i18next';
  
export default function ForgotPassword() {

  const location = useLocation()
  const emailFromLocation = location.state?.email

  const {errModal,errFields,validateResponse,errCode, clearErrors} = useApiError()
  const { t } = useTranslation()

  const [inpEmail,setInpEmail] = useState(emailFromLocation||"")

  const [step,setStep] = useState(0)
  // 0 - input email
  // 1 - loading email
  // 2 - input code + password
  // 3 - loading reset
  // 4 - success

  const [emailData,setEmailData] = useState({})
  const { formatted } = useCountdownTimer(emailData ? emailData.timeout * 60 * 1000 : 0);
  
  const [
    [
      [inpCode,setInpCode,errInpCode],
      [inpPassword,setInpPassword,errPassword],
      [inpPassword2,setInpPassword2,errPassword2],
    ],
    {getFormValues,resetFormValues,formIsEdited,validateForEmptyFields,validateFoValidFields}
  ] = useForm([
    {fieldName:"code"},
    {fieldName:"password", validator:"password"},
    {fieldName:"password2", validator:"password2"},
  ])

  async function handleSubmitSendCode(e){
    e.preventDefault()
    setStep(1)

    const response = await callApi(URL_RESET_PASSWORD_REQUEST,{email:inpEmail})

    if(! validateResponse(response)){
      setStep(0)
      return
    }

    setEmailData(response.data)
    setStep(2)
  
  }
  
  
  async function handleCheckCode(e){
    e.preventDefault()
    
    if(!validateForEmptyFields())return
    if(!validateFoValidFields())return

    const payload = getFormValues()

    setStep(3)
    const response = await callApi(URL_RESET_PASSWORD,{email:inpEmail,...payload})

    if(! validateResponse(response)){
      setStep(2)
      return
    }

    setStep(4)
  }

  return (<>
    {errModal}
    <div className="Page ForgotPassword">
      <div className='form'>
        {
          (step === 0 || step === 1)&&
          <>
            <h1>{t('forgot_password.title')}</h1>
            
              <InputText 
                placeholder="Email" 
                value={inpEmail} 
                onChange={(e)=>setInpEmail(e.target.value.toLowerCase())}
                error={errFields?.email}
                autoFocus
                onEnter={handleSubmitSendCode}
              />
              <button className='button' onClick={handleSubmitSendCode}>
                {step === 0 && t('forgot_password.send_code_btn')}
                {step === 1 &&  <span className='spinner small' />}
              </button>
          </>
        }

        {(step === 2 || step === 3) &&
          <>
            <h1>{t('forgot_password.code_sent_title')}</h1>
            <p>{t('forgot_password.code_sent_to')} <b>{emailData?.email}</b></p>
            <p>{t('common.expires_in', {time: formatted})}</p>

             <InputText

              title={t('common.code')}
              value={inpCode}
              onChange={e=>setInpCode(e.target.value)}
              error={errInpCode||errFields?.code}
              placeholder="ABC123"
              autoFocus
            />

            <InputPassword
              title={t('forgot_password.new_password_label')}
              value={inpPassword}
              onChange={e=>setInpPassword(e.target.value)}
              error={errPassword || errFields?.password}
            />

            <InputPassword
              title={t('common.repeat_password')}
              value={inpPassword2}
              onChange={e=>setInpPassword2(e.target.value)}
              error={errPassword2 || errFields?.password2}
            />
            <button className='button' onClick={handleCheckCode}>
              {step === 2 && t('forgot_password.submit_btn')}
              {step === 3 && <span className='spinner small' />}
            </button>
          </>
        }

        {step === 4 &&
          <>
            <h1>{t('forgot_password.success_title')}</h1>
            <p>{t('forgot_password.success_before')} <Link to={ROUTES.LOGIN} state={{email:inpEmail}}>{t('forgot_password.success_login_link')}</Link> {t('forgot_password.success_after')}</p>
          </>
        }
      </div>

      <footer>
        <Link to={ROUTES.LOGIN}  state={{email:inpEmail}}>Login</Link>
        <Link to={ROUTES.SIGNUP}  state={{email:inpEmail}}>Signup</Link>
      </footer>
    </div>
  </>
  );
}
  