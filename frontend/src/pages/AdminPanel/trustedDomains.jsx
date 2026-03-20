import { useState } from "react"
import { useTranslation } from "react-i18next"
import { TextModal } from "../../elio-react-components/components/Modals/TextModal/TextModal"
import { InputText } from "../../elio-react-components/components/inputs/InputText/InputText"
import { useElioAuth } from "../../contexts/ElioAuthContext";
import { api } from "../../api/ApiAdapter";
import { callApi } from "../../api/api"
import { URL_CONFIGURATION_CREATE, URL_CONFIGURATION_DELETE } from "../../api/urls"
import log from "../../utils/log"





export default function TrustedDomains({configuration,setConfiguration}) {

  const [isCreatingDomain,setIsCreatingDomain] = useState(false)
  const [newDomain,setNewDomain] = useState("")
  const [errMsg,setErrMsg] = useState("")
  const [isLoading,setIsLoading] = useState(false)
  const [deleteingDomain,setDeletingDomain] = useState(null)
  const [isLoadingDelete,setIsLoadingDelete] = useState(false)

  const jwt = api.getAccessToken()
  const { t } = useTranslation()

  async function handleSubmmit(){
    // setIsCreatingDomain(false)

    if(!newDomain){
      return setErrMsg(t('admin.trusted_domains_required'))
    }

    setIsLoading(true)
    const resp = await callApi(URL_CONFIGURATION_CREATE,{
      field:"trusted_register_domain",
      value:newDomain
    },jwt)
    setIsLoading(false)

    if(resp?.success){
      setConfiguration(resp.data)
      handleExit()
    }else{
      setErrMsg  (resp?.err?.more || resp?.err?.msg || t('admin.trusted_domains_generic_error'))
    }

    log(resp)
  }

  function handleExit(){
    setIsCreatingDomain(false)
    setNewDomain("")
    setDeletingDomain(null)
  }



  async function handleDelete(){
    
    setIsLoadingDelete(true)
    const resp = await callApi(URL_CONFIGURATION_DELETE,{
      id:deleteingDomain.id
    },jwt)
    setIsLoadingDelete(false)

    if(resp?.success){
      setConfiguration(resp.data)
    }else{
      log("ERROER",resp)
    }

    handleExit()
  }

  return(<>

      {
        deleteingDomain &&
        <TextModal title={t('admin.trusted_domains_delete_title')} aceptar={handleDelete} setIsOpen={handleExit} aceptarRed cancelar={handleExit} aceptarLoading={isLoadingDelete}>
          <p>{t('admin.trusted_domains_delete_confirm', {domain: deleteingDomain.value})}</p>
          <small>{t('admin.trusted_domains_delete_note')}</small>
        </TextModal>
      }
      {
      isCreatingDomain &&
      <TextModal title={t('admin.trusted_domains_add_title')} aceptar={handleSubmmit} setIsOpen={handleExit} aceptarLoading={isLoading}>
        <div className="modal__admin__addTrustedDomain">

          <p>{t('admin.trusted_domains_add_header')}</p>

          <InputText 
            value={newDomain}
            onChange={(e)=>setNewDomain(e.target.value)}
            placeholder="example.com"
            error={errMsg}
            autoFocus
            onEnter={handleSubmmit}
          />
          <small>
            {t('admin.trusted_domains_info')}
          </small>

          {newDomain?.trim() && (
            <>
              {newDomain.includes(".") ? (
                <>
                  <p>
                    {t('admin.trusted_domains_example_with_dot')} <b>usuario@{newDomain}</b>
                  </p>
                  <small>
                    {t('admin.trusted_domains_exact_note')}
                  </small>
                </>
              ) : (
                <>
                  <p>
                    {t('admin.trusted_domains_examples_without_dot')} <br />
                    <b>usuario@{newDomain}.com</b>,<br />
                    <b>usuario@{newDomain}.es</b>,<br />
                    <b>usuario@{newDomain}.org</b>
                  </p>
                  <small>
                    {t('admin.trusted_domains_no_ext_note')}
                  </small>
                </>
              )}
            </>
          )}
          
        </div>

      </TextModal>
    }

    <section>
      <h2>{t('admin.trusted_domains_section')}</h2>
      <ul className='trustedDomains'>
        {
          configuration?.trusted_register_domain?.map((domain, i) => (
            <li key={i}>
                <span>{domain.value}</span>
                <button onClick={()=>setDeletingDomain(domain)}>&times;</button>
              </li>
            ))
            
          }
          <button className='add' onClick={()=>setIsCreatingDomain(true)}>+</button>
      </ul>
    </section>
  
  </>)
}