import "./Users.css"
import { Table } from "../../elio-react-components/components/Table/Table"
import { use, useEffect, useState } from "react";
import { callApi } from "../../api/api";
import { URL_GET_LOCATIONS, URL_USERS_DELETE, URL_USERS_LIST, URL_VALIDATE_RESEND } from "../../api/urls";
import { useElioAuth } from "../../contexts/ElioAuthContext";
import { api } from "../../api/ApiAdapter";
import ModalCreateUser from "./ModalCreateUser";
import { TextModal } from "../../elio-react-components/components/Modals/TextModal/TextModal";
import log from "../../utils/log";
import icoFilter from "../../assets/icons/actions/filter.svg"
import icoEmail from "../../assets/icons/actions/email.svg"
import icoCheck from "../../assets/icons/actions/check.svg"

import { InputText } from "../../elio-react-components/components/inputs/InputText/InputText";
import { getUserPlaceholder } from "../../utils/utils";


const userPlaceholder = getUserPlaceholder()
import { InputSelect } from "../../elio-react-components/components/inputs/InputSelect/InputSelect";
import { getPermisionsEqualLower } from "../../permissions";
import { useTranslation } from 'react-i18next';

export default function Users(){

  const { user } = useElioAuth()
  const permissions = user?.permissions ?? 0
  const availablePermissions = Object.keys(getPermisionsEqualLower(permissions))
  const { t } = useTranslation()

  const [locations, setLocations] = useState([])


  const [msg,setMsg] = useState("")

  const [users,setUsers] = useState([])
  const [loadingEmailUsers, setLoadingEmailUsers] = useState(new Set())
  const [succeededEmailUsers, setSucceededEmailUsers] = useState(new Set())
  const [isCreating,setIsCreating] = useState(false)
  const [editingElement, setEditingElement] = useState(null)


  //Delete modal
  const [elementToDelete, setElementToDelete] = useState(null)
  const [inpConfrimDelete, setInpConfirmDelete] = useState("")
  const [errDelete, setErrDelete] = useState("")

  // FILTER
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState(users)
  //filter values
  const [inpEmail,setInpEmail] = useState("")
  const [inpName,setInpName] = useState("")
  const [inpRole,setInpRole] = useState("")
  const [inpBike,setInpBike] = useState("")
  const [inpPhone,setInpPhone] = useState("")
  const [inpLocation,setInpLocation] = useState("")

  useEffect(()=>{
    fetchData()
  },[])
  
  useEffect(()=>{

    let result = users

    if(inpLocation){
      result = result.filter(el=>el.ubication_id === inpLocation.id)
    }

    if(!isFilterOpen){
      setFilteredUsers(result)
      return
    }

    if(inpEmail){
      result = result.filter(el=>el.email.includes(inpEmail))
    } 

    if(inpName){
      result = result.filter(el=>el.name.toLowerCase().includes(inpName.toLowerCase()))
    }

    if(inpPhone){
      result = result.filter(el=>el.phone.toLowerCase().includes(inpPhone.toLowerCase()))
    }

    if(inpRole){
      result = result.filter(el=>el.role.includes(inpRole))
    }

    if(inpBike){
      result = result.filter(el=>el.assignments.length>0 && el.assignments[0].bike.number.includes(inpBike))
    }

    log(result)

    setFilteredUsers(result)
  },[users,isFilterOpen,inpEmail,inpName,inpRole,inpBike,inpLocation])

  async function fetchData(){
    const resp = await callApi(URL_USERS_LIST,undefined,api.getAccessToken())
    let locs = locations
    if(locs.length === 0) {
      const locsResp = await callApi(URL_GET_LOCATIONS,undefined,api.getAccessToken())
      locs = locsResp.data
      setLocations(locs)
    }

    const nowEpoch = Math.floor(Date.now() / 1000);
    const nowWithMargin = nowEpoch + (0 * 60); // minutos en segundos

    setUsers(resp.data.map(user=>{
      log(user)

      // Filtrar assignments pasados
      const activeAssignments = user.assignments
        ? user.assignments.filter(assignment => assignment.endEpoch >= nowWithMargin)
        : [];

      if(user.ubication_id){
        const loc = locs.find(l=>l.id === user.ubication_id)
        return {...user, location: loc, assignments: activeAssignments}
      }
      return {...user, assignments: activeAssignments}
    }))
  }



  useEffect(()=>{
    setErrDelete("")
    setInpConfirmDelete("")
  },[elementToDelete])



  // Dummy handlers


  async function handleDeleteUser(){
    if(inpConfrimDelete !== elementToDelete.email){
      setErrDelete(t('users.email_mismatch'))
      return
    }

    try{
      const resp = await callApi(URL_USERS_DELETE, {user_id: elementToDelete.id}, api.getAccessToken())
      if(resp && resp.success){
        setElementToDelete(null)
        await fetchData()
      }else{
        setErrDelete((resp && resp.err && resp.err.msg) || t('users.delete_error'))
      }
    }catch(e){
      console.error(e)
      setErrDelete(t('users.network_error'))
    }

  }

  const handleAskUpdate = (element) => {
    setEditingElement(element)
    
  };



  function handleExitCreateUpdate(){
    setEditingElement(null)
    setIsCreating(false)
  }

  function handleNewUserOrEdit(newUser, more){




    log(newUser)

    if(editingElement){

      setUsers(prev=>{
        const updated = [...prev]
        const index = updated.findIndex(el=>el.id === newUser.id)
        updated[index] = {...updated[index],...newUser}

        return updated
      })

      setEditingElement(null)
    }else{

      if(!more?.emailSent && more?.link){
        setMsg(<>{t('users.user_created_no_email')} <br/> <a href={more.link}>{more.link}</a></>)
      }else{
        setMsg(t('users.user_created'))
      }

      setUsers(prev=>{
        const updated = [...prev]
        log(updated,newUser)
        updated.push(newUser)
        return updated
      })
    }


  }




  async function handleResendValidationEmail(user){
    setLoadingEmailUsers(prev => new Set(prev).add(user.id))
    try{
      const resp = await callApi(URL_VALIDATE_RESEND, {email: user.email}, api.getAccessToken())
      if(resp?.success){
        setSucceededEmailUsers(prev => new Set(prev).add(user.id))
      }
    }finally{
      setLoadingEmailUsers(prev => { const next = new Set(prev); next.delete(user.id); return next })
    }
  }

  return(
    <>
      {
        elementToDelete &&
        <TextModal
          setIsOpen={()=>setElementToDelete(null)}
          aceptar={handleDeleteUser}
          cancelar={()=>setElementToDelete(null)}
          title={t('users.delete_title')}
          aceptarRed
        >
          <p>{t('users.delete_confirm', {email: elementToDelete.email})}</p>
          <p>{t('users.delete_type_email', {email: elementToDelete.email})}</p>
          <InputText
            value={inpConfrimDelete}
            onChange={e=>setInpConfirmDelete(e.target.value)}
            placeholder={elementToDelete.email}
            error={errDelete}
          />
        </TextModal>
      }
      {
        (editingElement || isCreating) &&

        <ModalCreateUser
              locations={locations}
          editingElement={editingElement}
          onExit={handleExitCreateUpdate}
          onChange={handleNewUserOrEdit}
        />
      }

      {
        msg  &&
        <TextModal
          aceptar={()=>setMsg("")}
        >
          {msg}
        </TextModal>
      }
    
    <div className="Page Users__page admin">

      <h1>{t('users.title')}</h1>
      
      <div className="p-10 content">
        
        <div className="actions">
          <button className="button" onClick={()=>setIsFilterOpen(!isFilterOpen)}><img src={icoFilter} alt="" className="img-filter-white" /></button>
          <button className="button" onClick={()=>setIsCreating(true)}>{t('users.add_user')}</button>

          <InputSelect 
            className="button"
            inline
            options={locations}
            formatViewOption={opt=>opt?.name || t('users.all_locations')}
            onChange={setInpLocation}
            value={inpLocation}
            allowUnselect
            unselectStr={t('common.all', {defaultValue: 'Todas'})}
          />
        </div>

        {
          isFilterOpen &&
          <div className="filter filter-box">
            <InputText
              title={t('common.email')}
              palceholder={userPlaceholder.email}
              value={inpEmail}
              onChange={e=>setInpEmail(e.target.value.toLowerCase())}
              inline
            />

            <InputText
              title={t('signup.name_label')}
              palceholder={userPlaceholder.name}
              value={inpName}
              onChange={e=>setInpName(e.target.value)}
              inline
            />

            <InputText
              title={t('users.filter_bike')}
              palceholder={"1234"}
              value={inpBike}
              onChange={e=>setInpBike(e.target.value)}
              typeNumber
              inline
            />

            <InputSelect
              title={t('users.filter_role')}
              options={availablePermissions}
              value={inpRole}
              onChange={v=>setInpRole(v)}
              inline
              allowUnselect
            />

            <InputText
              title={t('common.phone')}
              palceholder={userPlaceholder.phone}
              value={inpPhone}
              onChange={e=>setInpPhone(e.target.value)}
              inline
            />
          </div>
        }

        <div className="container">
          <Table
            elements={filteredUsers}
            headers={[t('users.col_email'), t('users.col_active'), t('users.col_phone'), t('users.col_name'), t('users.col_role'), t('users.col_location'), t('users.col_bike')]}
            columnWidths={[3,1,2,2,2,2,2]}
            sortingColumn={2}
            elementToArray={(col)=>{
              return [
                col.email,
                <span className="active-indicator" data-value={col.activated} /> ,
                col.phone || "-",
                col.name,
                col.role,
                col.location?.name || "-",
                col.assignments?.length>0? col.assignments[0].bike.number  : "-"
              ]
            }}

            onDelete={setElementToDelete}
            onUpdate={handleAskUpdate}

            customActions={(col) => !col.activated ? [{
              icon: succeededEmailUsers.has(col.id) ? icoCheck : icoEmail,
              callback: handleResendValidationEmail,
              isLoading: loadingEmailUsers.has(col.id),
              disabled: succeededEmailUsers.has(col.id)
            }] : []}
          />
        </div>
      </div>


    </div>
    </>
  )
}