import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useElioAuth } from '../../contexts/ElioAuthContext';
import { api } from '../../api/ApiAdapter';
import './Profile.css';
import ModalChangePassword from './ModalChangePassword';
import ModalDeleteAccount from './ModalDeleteAccount';
import icoEdit from "../../assets/icons/actions/edit.svg"  
import icoCancel from "../../assets/icons/actions/cancel.svg"
import ModalEditField from './ModalEditField';
import { Hint } from '../../elio-react-components/components/Hint/Hint';
import i18n, { LANGUAGE_KEY, SUPPORTED_LANGUAGES } from '../../i18n/i18n';
import version from '../../../scripts/version';
import { InputSelect } from '../../elio-react-components/components/inputs/InputSelect/InputSelect';
import { callApi } from '../../api/api';
import { URL_USERS_UPDATE } from '../../api/urls';

export default function Profile() {

  const { user, logout, updateUser } = useElioAuth()
  const { t, i18n: i18nInstance } = useTranslation()

  const name = user?.name || ""
  const email = user?.email || ""
  const phone = user?.phone || ""
  const notificationChannel = user?.notification_channel || "none"
  const language = i18nInstance.language
  const changeLanguage = (lang) => { i18nInstance.changeLanguage(lang); localStorage.setItem(LANGUAGE_KEY, lang) }

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false)
  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [isEditPhoneOpen, setIsEditPhoneOpen] = useState(false)
  const [isEditNotificationChannelOpen, setIsEditNotificationChannelOpen] = useState(false)

  const [isLoadingNotChan, setIsLoadingNotChan] = useState(false)


  async function handleChangeNotificationChannel(value){
    setIsEditNotificationChannelOpen(false)
    setIsLoadingNotChan(true)
    const resp = await callApi(URL_USERS_UPDATE,{notification_channel: value},api.getAccessToken())
    setIsLoadingNotChan(false)
    if(resp.success){
      updateUser(resp.data)
    }
  }


  const notificationOptions = [
    { label: t('profile.notification_email'), value: "email" },
    { label: t('profile.notification_none'), value: "none" }
  ]

  return (
    <>

      { isEditNameOpen &&
        <ModalEditField setIsOpen={setIsEditNameOpen} field="name" initialValue={name} title={t('profile.name_label')}/>
      }

      { isEditPhoneOpen &&
        <ModalEditField setIsOpen={setIsEditPhoneOpen} field="phone" initialValue={phone} title={t('profile.phone_label')}/>
      }

      { isChangePasswordOpen &&
        <ModalChangePassword
          setIsOpen={setIsChangePasswordOpen}
        />
      }

      { isDeleteAccountOpen &&
        <ModalDeleteAccount
          setIsOpen={setIsDeleteAccountOpen}
        />
      }
      <div className="Page Profile p-10">

        <main>
          <h1>{t('profile.title')}</h1>
          <p>
            {t('profile.hello', {name})}
          </p>

          <div className='container p-10'>

            <div className='row'>
              <span>{t('profile.name_label')}:</span>
              <div className='actions'><b>{name}</b> <EditButton onClick={()=>setIsEditNameOpen(true)}/></div>
            </div>

            <div className='row'>
              <span>{t('profile.email_label')}:</span>
              <div className='actions'><b>{email}</b></div>
            </div>

            <div className='row'>
              <span>{t('profile.phone_label')}:

              <Hint>{t('profile.phone_hint')}</Hint>
              </span>
              
              <div className='actions'>
                <b>{phone || "-"}</b>
                <EditButton onClick={()=>setIsEditPhoneOpen(true)}/>
              </div>
            </div>

            <div className='row'>
              <span>{t('profile.change_password')}</span>
              <button className='button' onClick={()=>setIsChangePasswordOpen(true)}>{t('profile.change_btn')}</button>
            </div>

            <div className='row'>
              <span>{t('profile.language_label')}</span>
              <div className='actions'>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    className={`button${language === lang.code ? '' : ' muted'}`}
                    onClick={() => changeLanguage(lang.code)}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>


            <div className='row'>
              <span>{t('profile.notification_method')}</span>

              <div className='actions'>
                {
                  isLoadingNotChan ? <span className='spinner small black'/>
                  : isEditNotificationChannelOpen ?
                  <>
                    {notificationOptions.map(o => (
                      <button 
                        className={`button${notificationChannel === o.value ? '' : ' muted'}`}
                        key={o.value} 
                        onClick={() => handleChangeNotificationChannel(o.value)}
                      >
                        {o.label}
                      </button>
                    ))}
                    <EditButton onClick={()=>setIsEditNotificationChannelOpen(false)} ico={icoCancel}/>
                  </>
                :
                  <>
                    <b>{notificationOptions.find(o => o.value === notificationChannel)?.label || "-"}</b>
                    <EditButton onClick={()=>setIsEditNotificationChannelOpen(true)}/>
                  </>
                }
              </div>
            </div>

          </div>

          {/* <div className='container p-10'>
            <p className='i18n-demo'>{t('profile.demo_text')}</p>
          </div> */}



          <div className='container p-10'>
            <div className='row'>
              <p>{t('profile.delete_account')}</p>
              <button className='button--red' onClick={()=>setIsDeleteAccountOpen(true)}>{t('profile.delete_btn')}</button>
            </div>
          </div>

          <button className='button red lite' onClick={logout}>{t('profile.logout_btn')}</button>
        </main>



        <footer>
          <span>{version}</span>
        </footer>
       
      </div>
    </>
  );
}
  





function EditButton({onClick, ico= icoEdit}){
  return (
    <button className='EditButton' onClick={onClick}>
      <img src={ico} alt="" />
    </button>
  )

}