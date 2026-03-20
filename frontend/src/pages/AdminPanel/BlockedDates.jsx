import moment from "moment";
import { TextModal } from "../../elio-react-components/components/Modals/TextModal/TextModal";

import { useEffect, useState } from "react"
import { callApi } from "../../api/api";
import { URL_CONFIGURATION_CREATE, URL_CONFIGURATION_DELETE, URL_CONFIGURATION_UPDATE } from "../../api/urls";
import { useElioAuth } from "../../contexts/ElioAuthContext";
import { api } from "../../api/ApiAdapter";
import { InputSelect } from "../../elio-react-components/components/inputs/InputSelect/InputSelect";
import { DatePicker } from "@mantine/dates";

import icoEdit from "../../assets/icons/actions/edit.svg"
import log from "../../utils/log";
import InputToggle from "../../elio-react-components/components/inputs/InputToggle/InputToggle";
import renderDayFactory from "../../utils/calendarDayIndicator";
import { useTranslation } from 'react-i18next'

const rangeTypes = ["Desde","Desde Hasta", "Hasta"]


const daysOfWeek = [
  {name:"Lunes", short:"Lun", index:1},
  {name:"Martes", short:"Mar", index:2},
  {name:"Miércoles", short:"Mié", index:3},
  {name:"Jueves", short:"Jue", index:4},
  {name:"Viernes", short:"Vie", index:5},
  {name:"Sábado", short:"Sáb", index:6},
  {name:"Domingo", short:"Dom", index:0},
]

export default function BlockedDates({configuration,setConfiguration}) {

  const jwt = api.getAccessToken()
  const { t } = useTranslation()

  const [deletingRange,setDeletingRange] = useState(null)

  const [isCreatingModal,setIsCreatingModal] = useState(false)
  const [isEditingWeekdays,setIsEditingWeekdays] = useState(false)


  const [isLoading,setIsLoading] = useState(false)

  const [valueFrom,setValueFrom] = useState(null)
  const [valueTo,setValueTo] = useState(null)
  
  const [errMsg,setErrMsg] = useState(false)
  const [rangeType,setRangeType] = useState(rangeTypes[1])

  const [blockedDates,setBlockedDates] = useState([]) //with moment dates
  const [blockedWeekdays,setBlockedWeekdays] = useState([])
  const [inpBlockedWeekdays,setInpBlockedWeekdays] = useState([])


  useEffect(()=>{
    if(configuration){
      
      //parse unix to moment
      if(configuration?.blocked_date && Array.isArray(configuration?.blocked_date)){
        const newBlockedDates = configuration?.blocked_date.map(({id,value})=>{
          return{
            id,
            value,
            from: value.from ? moment.unix(value.from) : null,
            to: value.to ? moment.unix(value.to) : null,
          }
        })
        setBlockedDates(newBlockedDates)
      }else{
        setBlockedDates([])
      }

      if(configuration?.blocked_weekdays){
        setBlockedWeekdays(configuration?.blocked_weekdays.value.split(",").map(d=>d==="" ? null : Number(d)).filter(d=>d!==null))
      }

    }
  },[configuration])

  log("blockedWeekdays",blockedWeekdays)


  async function handleDelete(){
    setIsLoading(true)

    log(deletingRange)
    const resp = await callApi(URL_CONFIGURATION_DELETE,{
      id:deletingRange.id
    },jwt)
    setIsLoading(false)

    if(resp?.success){
      setConfiguration(resp.data)
      handleExit()
    }else{
      console.error(resp)
    }
  }


  function handleExit(){
    setIsCreatingModal(false)
    setDeletingRange(null)
    setRangeType(rangeTypes[1])
    setValueFrom(null)
    setValueTo(null)
    setIsEditingWeekdays(false)
  }


  function handleChangeSelectedDate(v){
    log(v)

    if(rangeType === rangeTypes[0]){
      // Desde
      setValueFrom(v)
      
    }else if(rangeType === rangeTypes[1]){
      // Desde Hasta
      const [from,to] = v
      setValueFrom(from)
      setValueTo(to)

    }else{
      // Hasta
      setValueTo(v)
    }
  }


  async function handleSubmitCreate(){

    setIsLoading(true)
    const from = moment(valueFrom).startOf('day').unix()
    const to = moment(valueTo).endOf('day').unix()

    const resp = await callApi(URL_CONFIGURATION_CREATE,{
      field:"blocked_date",
      value:{from,to}
    },jwt)
    setIsLoading(false)

    if(resp?.success){
      setConfiguration(resp.data)
      handleExit()
      // log(resp)
    }else{
      setErrMsg(resp?.err?.more || resp?.err?.msg || "Ha ocurrido un error")
    }


  }







  function handleToggleWeekday(dayIndex){
    setInpBlockedWeekdays(prev => {
      if (prev.includes(dayIndex)) {
        // existe → quitar
        return prev.filter(d => d !== dayIndex)
      }
  
      // no existe → añadir
      return [...prev, dayIndex]
    })
  }


  async function handleSubmitWeekdays(){

    const weekdaysString = inpBlockedWeekdays.sort().join(",")
    setIsLoading(true)
    const resp = await callApi(URL_CONFIGURATION_UPDATE, [{ field_id: configuration.blocked_weekdays.id, value: weekdaysString }], jwt);
    setIsLoading(false)

    if(resp.success){ 

      setConfiguration(resp.data)
      handleExit()
    }else{
      setErrMsg(t('admin.save_error'))
    }
    
  }

  return (<>

  {
      isEditingWeekdays && <TextModal
        title={t('admin.weekdays_modal_title')}
        setIsOpen={setIsEditingWeekdays}
        aceptar={handleSubmitWeekdays}
        aceptarLoading={isLoading}
        aceptarText={t('admin.weekdays_update_btn')}

      >
        {t('admin.weekdays_modal_desc')}
        <ul className="modal_editing_weekdays">
          {
            daysOfWeek.map(({name,index})=>(<li key={index}>
              {name} 
              <span><InputToggle value={inpBlockedWeekdays.includes(index)} onChange={()=>handleToggleWeekday(index)}/></span>
            </li>))
          }
         </ul>

      </TextModal>
  }



    {
      isCreatingModal && <TextModal
        title="Crear"
        setIsOpen={handleExit}
        aceptar={handleSubmitCreate}
        aceptarLoading={isLoading}
      >
        <InputSelect 
          options={rangeTypes}
          value={rangeType}
          onChange={setRangeType}
          aceptarLoading={isLoading}
        />

        <p>
          {
            rangeType === rangeTypes[0] ? t('admin.range_desc_from')
            : rangeType === rangeTypes[1] ? t('admin.range_desc_range')
            : t('admin.range_desc_to')
          }
        </p>

        <DatePicker
          type={rangeType === rangeTypes[1] ? "range" : ""}
          numberOfColumns={2}
          onChange={handleChangeSelectedDate}
          value={
            rangeType === rangeTypes[0] ? valueFrom
            : rangeType === rangeTypes[1] ? [valueFrom,valueTo]
            : valueTo
          }
          renderDay={renderDayFactory(blockedDates.map(d=>({
            start: d.from,
            end: d.to,
          })))}


        />  




      </TextModal>
    }



    {deletingRange && 
      <TextModal 
        title={"Eliminar"} 
        aceptar={handleDelete} 
        setIsOpen={handleExit} 
        aceptarRed 
        cancelar={handleExit} 
        aceptarLoading={isLoading}
      >
        <p>
          {t('admin.blocked_delete_confirm')}
          <b>
            {deletingRange.value.from && 
              <div> {t('admin.blocked_from')} <span>{deletingRange.from.format("DD/MM/YY")}</span></div>
            }
            {deletingRange.value.to &&
              <div> {t('admin.blocked_to')} <span>{deletingRange.to.format("DD/MM/YY")}</span></div>
            }
          </b>
          
        </p>  
      </TextModal>
    }


    


    <section>

      <h2>{t('admin.blocked_dates_title')}</h2>
      <p>{t('admin.blocked_dates_label')}</p>
      <ul className="BlockedDates">
        {
          blockedDates.map((date, i) => (
            <li key={i}>
                  <span>
                    {
                      date.from && <div>
                        desde <b>{date.from.format("DD/MM/YY")}</b>
                      </div>
                    }
                    {
                      date.to && <div>
                        hasta <b>{date.to.format("DD/MM/YY")}</b>
                      </div>
                    }
                  </span>
                <button onClick={()=>setDeletingRange(date)}>&times;</button>
              </li>
            ))
        }
        <button className='add' onClick={()=>setIsCreatingModal(true)}>+</button>

      </ul>
        <hr />
      
      <div className="content_column">

        <div className="content">
          {t('admin.blocked_weekdays_label')}
          <b>
            {daysOfWeek.filter(d=>blockedWeekdays.includes(d.index)).map(d=>d.short).join(", ") || t('admin.blocked_weekdays_none')}
          </b>
          <button className="edit button_muted" onClick={()=>{setIsEditingWeekdays(true);setInpBlockedWeekdays([...blockedWeekdays])}}>
            <img src={icoEdit} alt="" />  
          </button>
        </div>


        

        
      </div>
    </section>


    </>
  );
}
