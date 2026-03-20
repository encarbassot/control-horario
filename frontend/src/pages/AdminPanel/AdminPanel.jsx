import { useEffect, useState } from 'react';
import './AdminPanel.css';
import { callApi } from '../../api/api';
import { URL_CONFIGURATION_LIST } from '../../api/urls';
import { useElioAuth } from '../../contexts/ElioAuthContext';
import { api } from '../../api/ApiAdapter';
import { TextModal } from '../../elio-react-components/components/Modals/TextModal/TextModal';
import TrustedDomains from './trustedDomains';
import LockerCode from './lockerCode';
import AssignmentTime from './AssignmentTime/AssignmentTime.jsx';
import BlockedDates from './BlockedDates';
import log from '../../utils/log';
import { useTranslation } from 'react-i18next';
  
export default function AdminPanel() {


  const { t } = useTranslation()

  // TODO: fetch policies from API when available
  const TRUSTED_DOMAIONS_SIGNUP_POLICY = false
  const COMPANY_HAS_LOCKER_CODE = false
  


  const [isLoading,setIsLoading] = useState(false)
  const [errMsg,setErrMsg] = useState("")
  const [configuration,setConfiguration] = useState([])

  log("CONFIGURATION",configuration)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData(){ 
    setIsLoading(true)
    const response = await callApi(URL_CONFIGURATION_LIST,{},api.getAccessToken())
    setIsLoading(false)

    if(response?.success){
      log("CONFIGURATION",response.data)
      setConfiguration(response.data)
      log(response.data)
    }else{
      setErrMsg(t('admin.error'))
    }
  }


  return (<>
    {errMsg && <TextModal title={"Error"} aceptar={()=>setErrMsg("")}>
      {errMsg}
    </TextModal>}




    <div className="Page AdminPanel admin">
      <div className='AdminPanel__content'>

        <h1>{t('admin.title')}</h1>

        {isLoading ? <p>{t('admin.loading')}</p>
        
        :<>
          {TRUSTED_DOMAIONS_SIGNUP_POLICY &&
            <TrustedDomains configuration={configuration} setConfiguration={setConfiguration}/>
          }

          {
            COMPANY_HAS_LOCKER_CODE &&
            <LockerCode configuration={configuration} setConfiguration={setConfiguration} />
          }
          <AssignmentTime configuration={configuration} setConfiguration={setConfiguration} />
          <BlockedDates configuration={configuration} setConfiguration={setConfiguration} />
        </>
      }
      </div>

    

    </div>
    </>
  );
}
  